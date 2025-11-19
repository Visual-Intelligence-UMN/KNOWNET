from flask import Blueprint, request, jsonify
# from flask_cors import cross_origin   # ← remove per-route CORS
from neo4j import GraphDatabase
import os, re, traceback

from embeds import status as embeds_status  # keep health endpoint; no hot-path embeddings

verify_bp = Blueprint("verify_bp", __name__)

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "knowpass123")
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

OPENAI_EMBED_MODEL = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-ada-002")
REL_EQUIV_THRESHOLD = float(os.getenv("REL_EQUIV_THRESHOLD", "0.94"))

REL_MAP = {
    "interact": "INTERACTS_WITH","interacts": "INTERACTS_WITH","interacts with": "INTERACTS_WITH",
    "binds": "INTERACTS_WITH","binding": "INTERACTS_WITH","complexes with": "INTERACTS_WITH",
    "affect": "AFFECTS","affects": "AFFECTS","impact": "AFFECTS","impacts": "AFFECTS",
    "increase": "AUGMENTS","increases": "AUGMENTS","enhance": "AUGMENTS","enhances": "AUGMENTS",
    "stimulate": "STIMULATES","stimulates": "STIMULATES","activate": "STIMULATES","activates": "STIMULATES",
    "inhibit": "INHIBITS","inhibits": "INHIBITS","suppress": "INHIBITS","suppresses": "INHIBITS",
    "disrupt": "DISRUPTS","disrupts": "DISRUPTS","impair": "DISRUPTS","impairs": "DISRUPTS",
    "treat": "TREATS","treats": "TREATS",
    "prevent": "PREVENTS","prevents": "PREVENTS","protect": "PREVENTS","protects": "PREVENTS",
    "cause": "CAUSES","causes": "CAUSES",
    "predispose": "PREDISPOSES","predisposes": "PREDISPOSES",
    "complicate": "COMPLICATES","complicates": "COMPLICATES",
    "produce": "PRODUCES","produces": "PRODUCES",
    "coexists with": "COEXISTS_WITH",
    "associated with": "ASSOCIATED_WITH","associate": "ASSOCIATED_WITH","associates with": "ASSOCIATED_WITH",
}

def normalize_relation(rel: str) -> str:
    if not rel: return ""
    s = re.sub(r"[^\w\s-]", "", rel.strip().lower())
    s = re.sub(r"[_\s]+", " ", s).strip()
    if s in REL_MAP: return REL_MAP[s]
    if s.endswith("ing") and s[:-3] in REL_MAP: return REL_MAP[s[:-3]]
    if s.endswith("ed") and s[:-2] in REL_MAP: return REL_MAP[s[:-2]]
    if s.endswith("s") and s[:-1] in REL_MAP: return REL_MAP[s[:-1]]
    return s.upper().replace(" ", "_")

def _rel_text(canon: str) -> str:
    return (canon or "").replace("_", " ").lower().strip()

@verify_bp.route("/api/_health", methods=["GET"])
def _health():
    emb = embeds_status()
    return jsonify({
        "embeddings": emb,
        "neo4j_uri": NEO4J_URI,
        "model": OPENAI_EMBED_MODEL,
        "entity_threshold": os.getenv("ENTITY_SIM_THRESHOLD", "0.80"),
        "loaded": bool(emb.get("loaded")),
    })

@verify_bp.route("/api/_probe_node", methods=["GET"])
def _probe_node():
    name = (request.args.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name query param required"}), 400
    q =  """
    MATCH (n:Node)
    WHERE toLower(coalesce(n.Name, n.name, n.name_lc)) = toLower($name)
    RETURN labels(n) AS labels, coalesce(n.Name, n.name, n.name_lc) AS Name, n.CUI AS CUI, id(n) AS id
    LIMIT 5
    """
    with driver.session() as s:
        rows = s.run(q, name=name).data()
    return jsonify({"matches": rows})

@verify_bp.route("/api/verify", methods=["POST"])
def verify_triples():
    try:
        data = request.get_json(force=True) or {}
        triples = data.get("triples", [])
        if not isinstance(triples, list):
            return jsonify({"error": "triples must be a list of [head, relation, tail]"}), 400

        results = []
        with driver.session() as session:
            for t in triples:
                if not (isinstance(t, (list, tuple)) and len(t) == 3):
                    results.append({"head": None,"relation": None,"tail": None,
                                    "rel_norm": "","status":"unsure","count":0,"papers":[],
                                    "ui_hint":"missing","resolved":{}})
                    continue

                head_raw, rel_raw, tail_raw = (t[0] or "").strip(), (t[1] or "").strip(), (t[2] or "").strip()
                rel_norm = normalize_relation(rel_raw)

                # Fast path: exact, case-insensitive match using raw names (no embeddings)
                q_direct = """
                MATCH (h:Node),(t:Node)
                WHERE toLower(coalesce(h.Name, h.name, h.name_lc)) = toLower($hname)
                  AND toLower(coalesce(t.Name, t.name, t.name_lc)) = toLower($tname)
                MATCH (h)-[r]-(t)
                WITH toUpper(coalesce(r.Type, type(r))) AS reltype,
                     count(r) AS evidence,
                     collect(r.PubMed_ID)[0..50] AS papers
                RETURN reltype, evidence, papers
                """
                rows = session.run(q_direct, hname=head_raw, tname=tail_raw).data()
                same = [r for r in rows if (r.get("reltype") or "").upper() == rel_norm]

                def best(rows_):
                    return max(rows_, key=lambda x: int(x.get("evidence") or 0)) if rows_ else None

                if same:
                    top = best(same)
                    results.append({
                        "head": head_raw, "relation": rel_raw, "tail": tail_raw, "rel_norm": rel_norm,
                        "status": "supported", "count": int(top["evidence"] or 0),
                        "papers": top.get("papers") or [], "ui_hint": "solid",
                        "resolved": {"head": head_raw, "tail": tail_raw}
                    })
                    continue

                if rows:
                    top = best(rows)
                    results.append({
                        "head": head_raw, "relation": rel_raw, "tail": tail_raw, "rel_norm": rel_norm,
                        "status": "relevant", "count": int(top["evidence"] or 0),
                        "papers": top.get("papers") or [], "ui_hint": "weak",
                        "resolved": {"head": head_raw, "tail": tail_raw, "alt_rel": top["reltype"]}
                    })
                    continue

                q_two = """
                MATCH (h:Node),(t:Node)
                WHERE toLower(coalesce(h.Name, h.name, h.name_lc)) = toLower($hname)
                  AND toLower(coalesce(t.Name, t.name, t.name_lc)) = toLower($tname)
                MATCH (h)-[r1]-(m:Node)-[r2]-(t)
                WITH m,
                     toUpper(coalesce(r1.Type, type(r1))) AS r1_type,
                     toUpper(coalesce(r2.Type, type(r2))) AS r2_type,
                     count(r1) AS c1, count(r2) AS c2
                RETURN coalesce(m.Name, m.name, m.name_lc) AS bridge, r1_type, r2_type, (c1 + c2) AS total_weight
                ORDER BY total_weight DESC
                LIMIT 1
                """
                hop2 = session.run(q_two, hname=head_raw, tname=tail_raw).single()
                if hop2:
                    results.append({
                        "head": head_raw, "relation": rel_raw, "tail": tail_raw, "rel_norm": rel_norm,
                        "status": "relevant", "count": 0, "papers": [], "ui_hint": "weak",
                        "resolved": {"head": head_raw, "tail": tail_raw, "bridge": hop2["bridge"]}
                    })
                    continue

                results.append({
                    "head": head_raw, "relation": rel_raw, "tail": tail_raw, "rel_norm": rel_norm,
                    "status": "unsure", "count": 0, "papers": [], "ui_hint": "missing",
                    "resolved": {"head": head_raw, "tail": tail_raw}
                })

        return jsonify({
            "meta": {"impl": "verify-direct-v1", **embeds_status()},
            "results": results
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
