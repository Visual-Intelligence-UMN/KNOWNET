from flask import Blueprint, request, jsonify
from neo4j import GraphDatabase

verify_bp = Blueprint("verify_bp", __name__)
driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "passwordknow"))

@verify_bp.route("/api/verify", methods=["POST"])
def verify_triples():
    data = request.json
    triples = data.get("triples", [])

    results = []
    with driver.session() as session:
        for head, rel, tail in triples:
            cypher = """
            MATCH (h)-[r]->(t)
            WHERE toLower(h.name) = toLower($head)
              AND toLower(t.name) = toLower($tail)
              AND toLower(type(r)) = toLower($rel)
            RETURN h, r, t
            """
            result = session.run(cypher, head=head, tail=tail, rel=rel)
            found = result.single()
            status = "verified" if found else "missing"
            results.append({
                "head": head,
                "relation": rel,
                "tail": tail,
                "status": status
            })

    return jsonify({"results": results})
