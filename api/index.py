from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import openai 
import os
from dotenv import load_dotenv
import re
import time
# import { OpenAIStream, StreamingTextResponse } from 'ai'
from embedding_utils import get_embeddings
from sklearn.preprocessing import normalize
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity as cosine_similarity_sklearn
from openai import OpenAI
from verify import verify_bp


load_dotenv()

app = Flask(__name__)
app.register_blueprint(verify_bp)
CORS(app)
app.secret_key = os.urandom(12)
client=OpenAI()
recommendation_space = {}
recommendation_id_counter = 0  # Keep track of the next ID to assign


@app.route("/api/chat", methods=["POST"]) 
def post_chat():
    # print(os.getenv("OPENAI_API_KEY"), flush=True)

    json_data = request.get_json()
    messages = json_data.get('messages', [])
    print("backend received messages", messages, flush=True)
    
    qaPrompt = """
You are an expert in healthcare and dietary supplements and need to help users answer related questions.
Please return your response in a format where all entities and their relations are clearly defined in the response.
Specifically, use [] to identify all entities and relations in the response,
add () after identified entities and relations to assign unique ids to entities ($N1, $N2, ..) and relations ($R1, $R2, ...).
For the relation, also add the entities it connects to. Use ; to separate if this relation exists in more than one triple.
The entities can only be the following types: Dietary Supplement, Drugs, Disease, Symptom and Gene.
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
        client = OpenAI()
        res =  client.chat.completions.create(
            model='gpt-4o',
            messages=[
                {"role": 'assistant', 'content':qaPrompt},
                *messages
            ],
            temperature=1,
            stream=True
        )
        for chunk in res:
            content = chunk.choices[0].delta.content
            if content:
                yield f"{content}"
    return Response(generate(), content_type='text/event-stream')
        # return Response(generate(), mimetype='text/event-stream')


@app.route("/api/data", methods=["POST"]) 
def post_chat_message():
    data = request.json
    input_type = data.get("input_type")
    user_id = data.get("userId")
    triples = data.get("data", {}).get("triples")
    recommendId = data.get("data", {}).get("recommendId")
    start_time = time.time()

    app.logger.info("flask received triples: %s", triples)

    if not user_id:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

        # For a new conversation with no triples, return a message indicating there are no triples to process
    if input_type == "new_conversation" and not triples:
        return jsonify({
            "status": "success",
            "message": "No triples to process",
            "data": {
                "vis_res": [],
                "node_name_mapping": {},
                "recommendation": []
            }
        })

    # For continuing a conversation with no new triples, return the previous recommendations
    if input_type == "continue_conversation" and not triples and recommendId is not None:
        # Convert recommendId to integer if it's passed as a string
        recommendId = int(recommendId)
        # Process the selected recommendation
        selected_recommendation = None
        for key, value in recommendation_space.items():
            if value['id'] == recommendId:
                selected_recommendation = key
                break

        if selected_recommendation:
            del recommendation_space[selected_recommendation]
            recommendation = generate_recommendation()


        return jsonify({
            "status": "success",
            "message": "Continuing conversation with previous recommendations",
            "data": {
                "vis_res": [],
                "node_name_mapping": {},
                "recommendation": recommendation,
            }
        })

    try:
        # Call the agent function from AI_agent.py
        if input_type == "new_conversation":
            #reset the recommendation space
            recommendation_space.clear()
            # response_data = agent(triples, 0, "new_conversation")
            
            response_data = {"vis_res": 
                                {
                                    "nodes": [
                                        { "id": "1", "name": "Dietary supplements", "category": "Health" },
                                        { "id": "2", "name": "Alzheimer's disease", "category": "Disease" }
                                    ], 
                                    "edges": [
                                        { "source": "1", "target": "2", "category": "Causes", "PubMed_ID": "123456" }
                                    ]
                                }, 
                             "recommendation":
                                {}, 
                             "node_name_mapping":
                                {
                                     "node_name_mapping": { "Dietary supplements": "supplement", "Alzheimer's disease": "physiology" }

                                }
                            }


        elif input_type == "continue_conversation":
            # Handle the continue conversation logic
            # response_data = agent(triples, recommendId, "continue_conversation")
            response_data = []
        else:
            raise ValueError("Invalid input type")

        # Format the response data as per your schema
        response = {
            "status": "success",
            "message": "Chat session retrieved/created successfully",
            "triples": triples,
            "data": response_data
        }

    except Exception as e:
        app.logger.error("Error in processing the request: " + str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

    end_time = time.time()
    app.logger.info("Time taken for the request: " + str(end_time - start_time))

    return jsonify(response)

def generate_recommendation():
    recommendations = []
    for key, value in recommendation_space.items():
        recommendation_text = f"{value['entity']} and {value['neighbor']}"
        recommendations.append({
            "text": recommendation_text,
            "id": value['id']
        })
    return recommendations

def visualization_partial_match(matched_entity, unmatched_entity, relation, is_head_matched):
    """
    Create visualization components for partial matches.

    Parameters:
    - matched_entity: Tuple with matched entity CUI and name.
    - unmatched_entity: The unmatched entity name.
    - relation: The relation between the entities.
    - is_head_matched: Boolean indicating if the matched entity is the head of the triple.
    """
    nodes_res = []
    edges_res = []
    matched_cui = matched_entity[0]
    matched_category =  matched_entity[2]
    # Define the special node for the unmatched entity
    special_node = {
        "category": "NotFind",
        "id": unmatched_entity,
        "name": unmatched_entity
    }
    # using CUI to find the category of the matched entity
    # cypher_statement = "MATCH (n:Node{CUI:\"" + matched_cui + "\"}) RETURN n.Label"
    # uri = neo4j_url
    # driver = GraphDatabase.driver(uri, auth=("neo4j", "yuhou"))
    # session = driver.session()
    # neo4j_res = session.run(cypher_statement)
    # for record in neo4j_res:
    #    matched_category = record['n.Label']

    # # Create the node for the matched entity
    # matched_node = {
    #     "category": matched_category,
    #     "id": matched_cui,
    #     "name": matched_entity[1]
    # }

    # Create the edge with the correct direction based on is_head_matched
    special_edge = {
        "PubMed_ID": "None",
        "category": relation,
        "source": matched_cui if is_head_matched else unmatched_entity,
        "target": unmatched_entity if is_head_matched else matched_cui
    }

    # Append the nodes and edges to the visualization response
    nodes_res.append(special_node)
    # nodes_res.append(matched_node)
    edges_res.append(special_edge)
    return nodes_res, edges_res


def agent(triples, recommand_id, input_type):
    node_id_map = {}  # Maps CUI to Node_ID
    rel_id_map = {}  # Maps (Source_CUI, Target_CUI, Relation_Type) to Relation_ID

    # start_time = time.time()

    response_data = {"vis_res": []}
    vis_res = {"nodes": [], "edges": []}
    node_name_mapping = {}
    triple_entity_list = []
    for triple in triples:
        head, rel, tail = triple
        app.logger.info(head is None)
        app.logger.info(tail is None)
        triple_entity_list.append(head)
        triple_entity_list.append(tail)

    triple_embeddings = get_embeddings(triple_entity_list, model="text-embedding-ada-002")  # speed up the process by using batch processing
    normalized_vectors = normalize(np.asarray(triple_embeddings))
    similarity_list = cosine_similarity_sklearn(normalized_vectors, normalized_embedding)
    unmatched_entities = []  # Store unmatched entities
    triples_index = 0
    for triple in triples:
        head, rel, tail = triple

        matched_nodes, unmatched = match_KG_nodes([head, tail], similarity_list[triples_index:triples_index + 2])
        unmatched_entities.extend(unmatched)  # Add unmatched entities
        # Logic to handle different match scenarios
        if len(matched_nodes) == 1 and len(unmatched) == 1:
            # Identify if the head or tail is the matched entity
            is_head_matched = head in [node[2] for node in matched_nodes]  # Check if head is in matched_nodes by names
            matched_entity = matched_nodes[0]  # We have only one matched entity
            unmatched_entity = unmatched[0]  # Only one unmatched entity
            # Call visualization_partial_match with the correct parameters
            temp_nodes, temp_edges = visualization_partial_match(matched_entity, unmatched_entity, rel, is_head_matched)
            vis_res["nodes"].extend(temp_nodes)
            vis_res["edges"].extend(temp_edges)
        elif len(matched_nodes) == 2:
            triples_index += 2
            # temp_nodes, temp_edges = visualization(matched_nodes, node_id_map, rel_id_map)
            # vis_res["nodes"].extend(temp_nodes)
            # vis_res["edges"].extend(temp_edges)
            for i in range(len(matched_nodes)):
                node_name_mapping[matched_nodes[i][1]] = matched_nodes[i][2]
        else:
        # Handle cases where neither entity is matched, if needed
            for unmatched_entity in unmatched_entities:
                special_node = {
                    "category": "NotFind",
                    "id": unmatched_entity,
                    "name": unmatched_entity
                }
                vis_res["nodes"].extend(special_node)
            # Handle unmatched edges
            for triple in triples:
                head, rel, tail = triple
                # if both head and tail are unmatched, a special edge is created
                if head in unmatched_entities and tail in unmatched_entities:
                    special_edge = {
                        "PubMed_ID": "None",
                        "category": "NotFind",
                        "source": head,
                        "target": tail
                    }
                    # Create a visualization entry with no nodes but the special edge
                    vis_res["edges"].extend(special_edge)
    response_data["vis_res"] = vis_res
    response_data['node_name_mapping'] = node_name_mapping

    if input_type == "new_conversation":

        # triple_nodes_list, unmatched = match_KG_nodes(triple_entity_list, similarity_list)
        # add_recommendation_space(triple_nodes_list)  # Updates the recommendation space
        recommendation = generate_recommendation()
        response_data["recommendation"] = recommendation

    elif input_type == "continue_conversation" and recommand_id is not None:
        # Convert recommendId to integer if it's passed as a string
        recommendId = int(recommand_id)
        # Process the selected recommendation
        selected_recommendation = None
        for key, value in recommendation_space.items():
            if value['id'] == recommendId:
                selected_recommendation = key
                break
        if selected_recommendation:
            # entity, neighbor = selected_recommendation
            # # generate nodes and edges from chatgpt entity and neighbor
            # node_id, rel_id = subgraph_type(entity, neighbor, node_id, rel_id, node_id_map, rel_id_map)
            # # Optionally, remove the selected recommendation
            del recommendation_space[selected_recommendation]
            recommendation = generate_recommendation()
            response_data["recommendation"] = recommendation
    # app.logger.info("Time taken for the agent function: "+ str(time.time() - start_time))
    return response_data

if __name__ == "__main__":
    app.run(debug=True, port=5000)
