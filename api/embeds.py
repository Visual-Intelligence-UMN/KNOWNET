# api/embeds.py
from pathlib import Path
import os
import pandas as pd
import numpy as np

# --- module globals ---
_EMB_DF = None     # pandas DataFrame with ["Name","embedding"]
_MAT = None        # normalized embedding matrix (N, D)
_DIM = 0
_PATH = None

PARQUET_BASENAME = "ADInt_CUI_embeddings.parquet"

def _candidate_paths():
    envp = os.getenv("EMBEDDINGS_PATH")
    if envp:
        yield Path(envp)
    here = Path(__file__).resolve().parent
    yield here / PARQUET_BASENAME          # api/ADInt_CUI_embeddings.parquet
    yield here.parent / PARQUET_BASENAME   # <repo-root>/ADInt_CUI_embeddings.parquet
    yield Path.cwd() / PARQUET_BASENAME    # cwd if you run from repo root

def _default_path():
    for p in _candidate_paths():
        if p.exists():
            return str(p)
    return str(Path(__file__).with_name(PARQUET_BASENAME))

def load():
    """Load parquet once; return True if loaded; False if not available/corrupt."""
    global _EMB_DF, _MAT, _DIM, _PATH
    if _MAT is not None:
        return True
    _PATH = _default_path()
    if not os.path.exists(_PATH):
        return False
    try:
        df = pd.read_parquet(_PATH, columns=["Name", "embedding"])
        embs = []
        for v in df["embedding"].values:
            arr = np.asarray(v, dtype=np.float32)
            if arr.ndim != 1:
                arr = arr.reshape(-1)
            embs.append(arr)
        embs = np.vstack(embs)  # (N, D)
        norms = np.linalg.norm(embs, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        _EMB_DF = df.reset_index(drop=True)
        _MAT = embs / norms
        _DIM = int(_MAT.shape[1])
        return True
    except Exception:
        _EMB_DF = None
        _MAT = None
        _DIM = 0
        return False

def is_loaded():
    return _MAT is not None

def status():
    return {
        "loaded": bool(is_loaded()),
        "path": _PATH or _default_path(),
        "rows": int(_EMB_DF.shape[0]) if is_loaded() else 0,
        "dim": int(_DIM) if is_loaded() else 0,
    }

def resolve_entities(names, embed_fn=None, model=None, threshold=None):
    """
    Resolve free-text names to the closest KG name using cosine similarity
    against precomputed embeddings.

    Returns: list of dicts like {"best_name": str|None, "score": float}
    """
    if not names:
        return []
    if not is_loaded() and not load():
        # parquet not available -> return null matches
        return [{"best_name": None, "score": 0.0} for _ in names]

    # Lazy import to avoid hard OpenAI dependency at module import
    if embed_fn is None:
        from embedding_utils import get_embeddings as embed_fn

    vecs = np.asarray(embed_fn(names, model=model), dtype=np.float32)
    vecs /= (np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-9)

    sims = vecs @ _MAT.T  # (k, N)
    thr = float(os.getenv("ENTITY_SIM_THRESHOLD", threshold or "0.80"))

    out = []
    for i in range(sims.shape[0]):
        j = int(np.argmax(sims[i]))
        score = float(sims[i, j])
        best = _EMB_DF["Name"].iloc[j] if score >= thr else None
        out.append({"best_name": best, "score": score})
    return out
