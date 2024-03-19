from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import os
import openai
import pandas as pd
from neo4j import GraphDatabase
import numpy as np
import re
from sklearn.preprocessing import normalize
from sklearn.metrics.pairwise import cosine_similarity as cosine_similarity_sklearn
from embeddings_utils import get_embedding, get_embeddings
import pandas as pd
import gdown
import time

# Initialize Flask App
app = Flask(__name__)
app.secret_key = os.urandom(12)
CORS(app)

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(dotenv_path)
openai.api_key = os.getenv("OPENAI_API_KEY")

# Global variables from AI_Agent.py
output = 'api/ADInt_CUI_embeddings.parquet'
if not os.path.exists(output):
    url = os.getenv("EMBEDDING_URL")
    gdown.download(url, output, quiet=False)

kg_nodes_embedding = pd.read_parquet(output)
embedding_list = kg_nodes_embedding.embedding.values
normalized_embedding = normalize(np.vstack(embedding_list))

print("kg_nodes_embedding loaded" + str(kg_nodes_embedding.shape))
neo4j_url = os.getenv("NEO4J_URL")
recommendation_space = {}
recommendation_id_counter = 0  # Keep track of the next ID to assign


@app.route("/api/python", methods=["GET"])
def hello_world():
    return "<p>Hello, I am testing flask</p>"

@app.route("/api/chat", methods=["POST"])
def post_chat_message():
    data = request.json
    input_type = data.get("input_type")
    user_id = data.get("userId")
    keywords_list_answer = data.get("data", {}).get("keywords_list_answer")
    keywords_list_question = data.get("data", {}).get("keywords_list_question")
    recommendId = data.get("data", {}).get("recommendId")

    start_time = time.time()

    if not user_id:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    try:
        # Call the agent function from AI_agent.py
        if input_type == "new_conversation":
            response_data = agent(keywords_list_answer, keywords_list_question, 0, "new_conversation")

            # print(response_data)
        elif input_type == "continue_conversation":
            # Handle the continue conversation logic
            response_data = agent(keywords_list_answer, keywords_list_question, recommendId, "continue_conversation")
        else:
            raise ValueError("Invalid input type")

        # Format the response data as per your schema
        response = {
            "status": "success",
            "message": "Chat session retrieved/created successfully",
            "keywords_list_answer": keywords_list_answer,
            "keywords_list_question": keywords_list_question,
            "data": response_data
        }

    except Exception as e:
        app.logger.error("Error in processing the request: " + str(e))
        return jsonify({"status": "error", "message": str(e)}), 500
    
    end_time = time.time()
    app.logger.info("Time taken for the request: "+ str(end_time - start_time))

    return jsonify(response)

## AI Agent METHOD

# def AI_respnse(message):
#     qa_prompt = """
#     You are an expert in healthcare domain and need to help user to answer the healthcare related questions.
#     Also, please summary the specific entity/terms in your response (the keywords).
#     In addition, please identify the specific entity/terms from the question.
#     The entities/terms (keywords) can only be the following types: Dietary Supplement, Drugs, Disease, Symptom and Gene.
#     Please return your response in three parts: the first part is the answer of the question; the part part is the summarized entities/terms (keywords); the third part is the identified entities/terms from the question.
#     Please use " || " to split the three parts.
#     Please split the entities/terms (keywords) by " | " if there are more than one, and put them in "[]".
#     For example, if the question is "Can Ginkgo biloba prevent Alzheimer's Disease?"
#     Your response could be:
#     "Gingko biloba is a plant extract...
#     Some studies have suggested that Gingko biloba may improve cognitive function and behavior in people with Alzheimer's disease... ||
#     [Ginkgo biloba | Alzheimer‘s Disease] || [Ginkgo biloba | Alzheimer‘s Disease]"
#     If the question is "What are the benefits of fish oil?"
#     Your response could be:
#     "Fish oil is known for its rich content of Omega-3 fatty acids... The benefits of Fish Oil: Fish oil can delay or reduce the risk of cognitive decline.
#     Fight Inflammation: Omega-3 has potent... || [Fish Oil | Omega-3 fatty acids | cognitive decline | Inflammation] || [Fish Oil]"
#     If the question is "Can Coenzyme Q10 prevent Heart disease?"
#     Your response could be:
#     "Some studies have suggested that Coenzyme Q10 supplementation may have potential benefits for heart health... CoQ10 has antioxidant properties... ||
#     [Coenzyme Q10 | heart health || antioxidant] || [Coenzyme Q10 | Heart disease]
#     """

#     completions = openai.chat.completions.create(
#         model="gpt-4",
#         messages=[
#             {"role": "system", "content": qa_prompt},
#             {"role": "user", "content": message},
#         ]
#     )

#     response = completions.choices[0].message.content.split(" || ")

#     first_part = response[0]
#     second_part = response[1]
#     third_part = response[2]

#     keywords_list_answer = re.search(r'\[([^]]*)\]', second_part).group(1).split(" | ")
#     keywords_list_question = re.search(r'\[([^]]*)\]', third_part).group(1).split(" | ")

#     return [first_part, keywords_list_answer, keywords_list_question]


def match_KG_nodes_old(entity_list, query_embeddings):
    nodes_list = []
    start_time = time.time()
    
    for query_embedding, entity in zip(query_embeddings, entity_list):
    # for entity in entity_list:
    #     query_embedding = get_embedding(entity, model="text-embedding-ada-002")
        normalized_vector = normalize(np.asarray(query_embedding).reshape(1, -1))
        
        similarity_list = cosine_similarity_sklearn(normalized_vector, normalized_embedding)[0]

        max_index = np.argmax(similarity_list)

        max_similarity = similarity_list[max_index]
        if max_similarity > 0.94:
            nodes_list.append([kg_nodes_embedding.CUI.values[max_index], kg_nodes_embedding.Name.values[max_index], entity])

    app.logger.info("Time taken for the old KG matching: "+ str(time.time() - start_time))
    return nodes_list

def match_KG_nodes(entity_list, similarity_list):
    nodes_list = []
    
    for entity, similarity in zip(entity_list, similarity_list):

        max_index = np.argmax(similarity)
        max_similarity = similarity[max_index]
        if max_similarity > 0.94:
            nodes_list.append([kg_nodes_embedding.CUI.values[max_index], kg_nodes_embedding.Name.values[max_index], entity])

    return nodes_list

def select_subgraph(cypher_statement, node_id_map, rel_id_map):
    uri = neo4j_url
    driver = GraphDatabase.driver(uri, auth=("neo4j", "yuhou"))
    session = driver.session()
    neo4j_res = session.run(cypher_statement)

    nodes_res = []
    rel_res = []

    for record in neo4j_res:
        path_nodes = record['path'].nodes
        path_rels = record['path'].relationships
         # Process each node in path
        for node in path_nodes:
            cui = node['CUI']
            if cui not in node_id_map:
                node_id_map[cui] = cui
                nodes_res.append({'id': cui, "name": node['Name'], "category": node['Label']})
            else:
                # Node already exists, reuse Node_ID from map
                nodes_res.append({'id': cui, "name": node['Name'], "category": node['Label']})

        for rel in path_rels:
            pubmed_id = rel['PubMed_ID']
            rel_key = (path_nodes[0]['CUI'], path_nodes[1]['CUI'], rel['Type'])
            if pubmed_id not in rel_id_map:
                rel_id_map[pubmed_id] = pubmed_id
                rel_res.append({'PubMed_ID': pubmed_id, "source": node_id_map[path_nodes[0]['CUI']], "target": node_id_map[path_nodes[1]['CUI']], "category": rel['Type']})
            else:
                # Relationship already exists, reuse PubMed_ID from map
                existing_pubmed_id = rel_id_map[pubmed_id]
                # Update PubMed_ID for existing relationship if needed
                for existing_rel in rel_res:
                    if existing_rel['PubMed_ID'] == existing_pubmed_id:
                        existing_rel['PubMed_ID'] += " | " + pubmed_id
                        break

    return nodes_res, rel_res


def summarize_neighbor_type(cypher_statement):
    uri = neo4j_url
    driver = GraphDatabase.driver(uri, auth=("neo4j", "yuhou"))
    session = driver.session()
    neo4j_res = session.run(cypher_statement)
    res = []
    for i, record in enumerate(neo4j_res):
        path_nodes = record['path'].nodes
        node_label = path_nodes[1]['Label']
        if node_label not in res:
            res.append(node_label)

    return res


def subgraph_type(cui, target_type, node_id_map, rel_id_map):
    res = []
    cypher_statement = "MATCH path=(sub:Node{CUI:\"" + cui + "\"})-[rel:Relation*1]-(obj:Node{Label:\"" + target_type + "\"}) RETURN path LIMIT 20"
    nodes, edges = select_subgraph(cypher_statement, node_id_map, rel_id_map)
    res.append({"nodes": nodes, "edges": edges})
    return res

#TODO: Check recommendation visualization logic
def visualization(node_list, node_id_map, rel_id_map):
    res = []
    if len(node_list) == 1:
        cypher_statement = "MATCH path=(sub:Node{CUI:\"" + node_list[0][0] + "\"})-[rel:Relation*1]-(obj:Node) RETURN path LIMIT 10"
        nodes, edges = select_subgraph(cypher_statement, node_id_map, rel_id_map)
        res.append({"nodes": nodes, "edges": edges})
    else:
        for i in range(len(node_list) - 1):
            current_entity = node_list[i][0]
            for j in range(i + 1, len(node_list)):
                next_entity = node_list[j][0]
                cypher_statement = "MATCH path=(sub:Node{CUI:\"" + current_entity + "\"})-[rel:Relation*1]-(obj:Node{CUI:\"" + next_entity + "\"}) RETURN path LIMIT 10"
                nodes, edges = select_subgraph(cypher_statement, node_id_map, rel_id_map)
                if len(nodes) != 0:
                    res.append({"nodes": nodes, "edges": edges})
    if len(res) == 0:
        for i in range(len(node_list)):
            cypher_statement = "MATCH path=(sub:Node{CUI:\"" + node_list[i][0] + "\"})-[rel:Relation*1]-(obj:Node) RETURN path LIMIT 10"
            nodes, edges = select_subgraph(cypher_statement, node_id_map, rel_id_map)
            res.append({"nodes": nodes, "edges": edges})

    return res

# def add_recommendation_space(entity_list):
#     for entity in entity_list:
#         cypher_statement = "MATCH path=(sub:Node{CUI:\"" + entity[0] + "\"})-[rel:Relation*1]-(obj:Node) RETURN path LIMIT 30"
#         neighbor_list = summarize_neighbor_type(cypher_statement)
#         for neighbor in neighbor_list:
#             if [entity[1], neighbor] not in recommendation_space:
#                 recommendation_space.append([entity[0], entity[1], neighbor])

def add_recommendation_space(entity_list):
    global recommendation_id_counter
    for entity in entity_list:
        cypher_statement = f"MATCH path=(sub:Node{{CUI:\"{entity[0]}\"}})-[rel:Relation*1]-(obj:Node) RETURN path LIMIT 30"
        neighbor_list = summarize_neighbor_type(cypher_statement)
        for neighbor in neighbor_list:
            key = (entity[0], neighbor)  # Unique tuple to identify the recommendation
            if key not in recommendation_space:
                recommendation_space[key] = {
                    "id": recommendation_id_counter,
                    "entity": entity[1],
                    "neighbor": neighbor
                }
                recommendation_id_counter += 1


# def generate_recommendation():
#     res = ""
#     if len(recommendation_space) > 0:
#         for recommendation_candidate in recommendation_space:
#             res += recommendation_candidate[1] + " and " + recommendation_candidate[2] + ".\n"

#     return res

def generate_recommendation():
    recommendations = []
    for key, value in recommendation_space.items():
        recommendation_text = f"{value['entity']} and {value['neighbor']}"
        recommendations.append({
            "text": recommendation_text,
            "id": value['id']
        })
    return recommendations

def agent(keywords_list_answer, keywords_list_question, recommand_id, input_type):
    node_id_map = {}  # Maps CUI to Node_ID
    rel_id_map = {}  # Maps (Source_CUI, Target_CUI, Relation_Type) to Relation_ID
    
    # start_time = time.time()
    

    response_data = {"vis_res": []}

    # speed up the process by using batch processing
    query_embeddings = get_embeddings(keywords_list_answer+keywords_list_question, model="text-embedding-ada-002")  
    normalized_vectors = normalize(np.asarray(query_embeddings))    
    similarity_list = cosine_similarity_sklearn(normalized_vectors, normalized_embedding)

    nodes_list_answer = match_KG_nodes(keywords_list_answer, similarity_list[:len(keywords_list_answer)])

    vis_res = visualization(nodes_list_answer, node_id_map, rel_id_map)


    response_data["vis_res"] = vis_res

    response_data['node_name_mapping'] = {nodes_list_answer[i][1]: nodes_list_answer[i][2] for i in range(len(nodes_list_answer))}

    if input_type == "new_conversation":
        nodes_list_question = match_KG_nodes(keywords_list_question, similarity_list[len(keywords_list_answer):])

        add_recommendation_space(nodes_list_question)  # Updates the recommendation space
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


