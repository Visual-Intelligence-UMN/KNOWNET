# api/recommend.py
from flask import Blueprint, request, jsonify
from neo4j import GraphDatabase
import os

# keep health-only import; no hot-path embedding calls here
from embeds import status as embeds_status

recommend_bp = Blueprint("recommend_bp", __name__)

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "knowpass123")
_driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


def _node_name(n):
    # centralize coalesce logic if needed elsewhere
    return n.get("name") or n.get("Name") or n.get("name_lc") or ""


@recommend_bp.route("/api/recommend", methods=["POST"])
def recommend():
    data = request.get_json(force=True) or {}

    head_raw = (data.get("head") or "").strip()
    if not head_raw:
        return jsonify({"error": "head (node name) is required"}), 400

    # Use the raw head name directly (fast; no external embeddings)
    head_resolved = head_raw
    sim = 1.0  # trivial similarity since we didn't fuzzy-resolve

    k = int(data.get("k", 5))
    # direction is ignored because edges are undirected in this KG
    whitelist = [w.upper() for w in (data.get("whitelist") or [])]
    per_type_cap = int(data.get("per_type_cap", 2))  # kept for API compatibility
    exclude = [str(x).strip().lower() for x in (data.get("exclude") or [])]

    pool_limit = max(k * 6, 30)

    # Tolerant to Name/name/name_lc and to either property r.Type or relationship type(r)
    cypher = """
    MATCH (h)
    WHERE toLower(coalesce(h.name, h.Name, h.name_lc)) = toLower($head)

    MATCH (h)-[r]-(t)
    WITH h, t, r,
         toUpper(coalesce(r.Type, type(r))) AS rtype,
         coalesce(t.name, t.Name, t.name_lc) AS tname,
         coalesce(h.name, h.Name, h.name_lc) AS hname
    WHERE ($whitelist = [] OR rtype IN $whitelist)
      AND NOT toLower(tname) IN $exclude

    WITH hname, id(h) AS head_id, tname, id(t) AS tail_id, rtype, count(r) AS evidence
    ORDER BY evidence DESC, rtype ASC, toLower(tname) ASC
    LIMIT $limit

    RETURN hname AS head_name, head_id,
           tname AS tail_name, tail_id,
           rtype AS relation, evidence
    """

    params = {
        "head": head_resolved,
        "whitelist": whitelist,
        "exclude": exclude,
        "limit": pool_limit,
    }

    with _driver.session() as session:
        rows = session.run(cypher, **params).data()

    # There’s effectively one node label; keep a stable "types" field for UI
    for r in rows:
        r["tail_labels"] = ["Node"]

    # Simple diversity bucket (single type, but preserves API)
    buckets = {"Node": rows[:]}

    picked, type_counts = [], {"Node": 0}
    while len(picked) < k:
        progressed = False
        for t in ["Node"]:
            if type_counts[t] >= per_type_cap:
                continue
            if buckets[t]:
                picked.append(buckets[t].pop(0))
                type_counts[t] += 1
                progressed = True
                if len(picked) >= k:
                    break
        if not progressed:
            break

    if len(picked) < k:
        used = {(p["head_id"], p["relation"], p["tail_id"]) for p in picked}
        for r in rows:
            key = (r["head_id"], r["relation"], r["tail_id"])
            if key not in used:
                picked.append(r)
                if len(picked) >= k:
                    break

    suggestions = [{
        "text": f"Show me more about {r['head_name']} and {r['tail_name']}",
        "head": {"id": f"neo4j:{r['head_id']}", "name": r["head_name"], "types": ["Node"]},
        "relation": {"type": r["relation"], "direction": "--"},  # undirected
        "tail": {"id": f"neo4j:{r['tail_id']}", "name": r["tail_name"], "types": r.get("tail_labels") or ["Node"]},
        "count": int(r["evidence"] or 0),
        "source": "1-hop"
    } for r in picked]

    return jsonify({
        "resolved_head": head_resolved,
        "similarity": sim,
        "meta": {"embeddings": embeds_status()},
        "suggestions": suggestions
    })
