# api/index.py
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from dotenv import load_dotenv
from pathlib import Path
import os
import time

from openai import OpenAI
from verify import verify_bp
from recommend import recommend_bp

# Load local .env if present (keeps env-driven config working on AWS too)
load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

app = Flask(__name__)
app.register_blueprint(verify_bp)
app.register_blueprint(recommend_bp)

# Global CORS for /api/*
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    allow_headers=["Content-Type", "x-openai-key", "Authorization"],
    methods=["GET", "POST", "OPTIONS"],
)

app.secret_key = os.urandom(12)

@app.route("/api/data", methods=["POST"])
def post_chat_message():
    data = request.get_json(force=True) or {}
    input_type = data.get("input_type")  # "new_conversation" | "continue_conversation"
    triples = (data.get("data") or {}).get("triples") or []
    # minimal stub that satisfies the UI shape
    return jsonify({
        "status": "success",
        "message": "stub",
        "data": {
            "vis_res": {"nodes": [], "edges": []},
            "node_name_mapping": {},
            "recommendation": []
        }
    })

@app.route("/api/chat", methods=["POST"])
def post_chat():
    json_data = request.get_json(force=True) or {}
    messages = json_data.get("messages", [])

    # Accept API key from header or Authorization: Bearer <key>
    auth_header = (request.headers.get("Authorization") or "").strip()
    header_key = (request.headers.get("x-openai-key") or request.headers.get("X-OpenAI-Key") or "").strip()
    api_key = (
        header_key
        or (auth_header.startswith("Bearer ") and auth_header.replace("Bearer ", "").strip())
        or json_data.get("apiKey", "").strip()
    )

    if not api_key:
        return jsonify({"error": "Missing OpenAI API key"}), 401

    qaPrompt = """
You are an expert in healthcare and dietary supplements and need to help users answer related questions.
Please return your response in a format where all entities and their relations are clearly defined in the response.
Specifically, use [] to identify all entities and relations in the response,
add () after identified entities and relations to assign unique ids to entities ($N1, $N2, ..) and relations ($R1, $R2, ...).
When annotating an entity, append its category before the ID, separated by a vertical bar "|". The category must be one of: Dietary Supplement, Drugs, Disease, Symptom, Gene. For example: [Fish Oil|Dietary Supplement]($N1), [Alzheimer's disease|Disease]($N2).
For the relation, also add the entities it connects to. Use ; to separate if this relation exists in more than one triple.
The entities can only be the following types: Dietary Supplement, Drugs, Disease, Symptom and Gene.
Relation label policy (canonical KG types):
Use ONLY these exact relation labels in the square brackets (UPPER_SNAKE_CASE):
INTERACTS_WITH, AFFECTS, TREATS, PREVENTS, INHIBITS, STIMULATES, ASSOCIATED_WITH, CAUSES, AUGMENTS, PRODUCES, COEXISTS_WITH.

• The bracketed relation text MUST be one of the above (e.g., [INHIBITS]($R1, $N1, $N2)).
• You MAY use natural language in the prose, but the annotated relation label must be canonical.
• If the user’s phrasing is a paraphrase (e.g., “help slow”, “reducing”, “improve”), choose the closest canonical label (e.g., INHIBITS or AFFECTS). Do NOT invent new labels.
Each sentence in the response must include a clearly defined relation between entities, and this relation must be annotated.
Identified entities must have relations with other entities in the response.
Each sentence in the response should not include more than one relation.
When answering a question, focus on identifying and annotating only the entities and relations that are directly relevant to the user's query. Avoid including additional entities that are not closely related to the core question.
Try to provide context in your response.

After your response, also add the identified entities in the user question, in the format of a JSON string list;
Please use " || " to split the two parts.

Example 1,
if the question is "Can Ginkgo biloba prevent Alzheimer's Disease?"
Your response could be:
"Gingko biloba is a plant extract...
Some studies have suggested that [Gingko biloba]($N1) may [improve]($R1, $N1, $N2) cognitive function and behavior in people with [Alzheimer's disease]($N2)... ||
["Ginkgo biloba", "Alzheimer's Disease"]"

Example 2,
If the question is "What are the benefits of fish oil?"
Your response could be:
"[Fish oil]($N1) is known for its [rich content of]($R1, $N1, $N2) [Omega-3 fatty acids]($N2)... The benefits of [Fish Oil]($N1): [Fish Oil]($N1) can [reduce]($R2, $N1, $N3) the risk of [cognitive decline]($N3).
[Fight]($R3, $N2, $N4) [Inflammation]($N4): [Omega-3 fatty acids]($N2) has potent... || ["Fish Oil", "Omega-3 fatty acids", "cognitive decline", "Inflammation"]"

Example 3,
If the question is "Can Coenzyme Q10 prevent Heart disease?"
Your response could be:
"Some studies have suggested that [Coenzyme Q10]($N1) supplementation may [have potential benefits]($R1, $N1, $N2) for [heart health]($N2)... [Coenzyme Q10]($N1) [has]($R2, $N1, $N2) [antioxidant properties]($N2)... ||
["Coenzyme Q10", "heart health", "antioxidant", "Heart disease"]"

Example 4,
If the question is "Can taking Choerospondias axillaris slow the progression of Alzheimer's disease?"
Your response could be:
"
[Choerospondias axillaris]($N1), also known as Nepali hog plum, is a fruit that is used in traditional medicine in some Asian countries. It is believed to have various health benefits due to its [antioxidant]($N2) properties. However, there is limited scientific research on its effects on [Alzheimer's disease]($N3) specifically.

Some studies have suggested that [antioxidant]($N2) can help [reduce]($R1, $N2, $N3) oxidative stress, which is a factor in the development and progression of [Alzheimer's disease]($N3). Therefore, it is possible that the antioxidant properties of Choerospondias axillaris might have some protective effects against the disease. However, more research is needed to determine its efficacy and the appropriate dosage.  ||
["Choerospondias axillaris", "antioxidant", "Alzheimer's disease"]"

Example 5,
If the question is "What Complementary and Integrative Health Interventions are beneficial for people with Alzheimer's disease?"
Your response could be:
"Some Complementary and Integrative Health Interventions have been explored for their potential benefits in individuals with [Alzheimer's disease]($N1).

[Mind-body practices]($N2), such as yoga and meditation, are examples of interventions that may [improve]($R1, $N2, $N1) cognitive function and quality of life in people with [Alzheimer's disease]($N1). These practices can help reduce stress and improve emotional well-being.

Dietary supplements, including [omega-3 fatty acids]($N3) and [vitamin E]($N4), have been studied for their potential to [slow]($R2, $N3, $N2; $R3, $N4, $N2) cognitive decline in [Alzheimer's disease]($N2). [Omega-3 fatty acids]($N3) are known for their anti-inflammatory and neuroprotective properties, while [vitamin E]($N4) is an antioxidant that may [protect]($R3, $N4, $N5) [neurons]($N5) from damage.

[Aromatherapy]($N6) using essential oils, such as lavender, has been suggested to [help]($R4, $N6, $N1) with anxiety and improve sleep quality in individuals with [Alzheimer's disease]($N1).
|| ["Alzheimer's disease", "Mind-body practices", "omega-3 fatty acids", "vitamin E", "Aromatherapy"]"

Use the above examples only as a guide for format and structure. Do not reuse their exact wording. Always generate a unique, original response that follows the annotated format.
"""

    def generate():
        client = OpenAI(api_key=api_key)
        res = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "assistant", "content": qaPrompt}, *messages],
            temperature=1,
            stream=True,
        )
        for chunk in res:
            content = chunk.choices[0].delta.content
            if content:
                yield content  # SSE text stream

    return Response(
        generate(),
        content_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# (Optional) very simple liveness probe used by ops
@app.route("/api/_ping", methods=["GET"])
def _ping():
    return jsonify({"ok": True})


if __name__ == "__main__":
    # Bind to 0.0.0.0 so the frontend can hit it over the instance’s public IP
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
