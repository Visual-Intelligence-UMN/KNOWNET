"""
_*_CODING:UTF-8_*_
@Author: Yu Hou
@File: AI_Agent.py
@Time: 11/29/2310:07AM
"""

import openai
from neo4j import GraphDatabase
import pandas as pd
from embeddings_utils import get_embedding, cosine_similarity
import numpy as np
import re
from sklearn.preprocessing import normalize
from sklearn.metrics.pairwise import cosine_similarity as cosine_similarity_sklearn

kg_nodes_embedding = pd.read_parquet("/Users/youfuyan/Desktop/UMN/QianwenWang'lab/VisConAgent/api/ADInt_CUI_embeddings.parquet")
print("KG nodes embedding load complete...")
openai.api_key = ""
neo4j_url = "neo4j://3.83.33.130:7687"


def AI_respnse(message):
    qa_prompt = """
    You are an expert in healthcare domain and need to help user to answer the healthcare related questions.
    Also, please summary the specific entity/terms in your response (the keywords).
    In addition, please identify the specific entity/terms from the question.
    The entities/terms (keywords) can only be the following types: Dietary Supplement, Drugs, Disease, Symptom and Gene.
    Please return your response in three parts: the first part is the answer of the question; the part part is the summarized entities/terms (keywords); the third part is the identified entities/terms from the question.
    Please use " || " to split the three parts.
    Please split the entities/terms (keywords) by " | " if there are more than one, and put them in "[]".
    For example, if the question is "Can Ginkgo biloba prevent Alzheimer's Disease?"
    Your response could be:
    "Gingko biloba is a plant extract...
    Some studies have suggested that Gingko biloba may improve cognitive function and behavior in people with Alzheimer's disease... ||
    [Ginkgo biloba | Alzheimer‘s Disease] || [Ginkgo biloba | Alzheimer‘s Disease]"
    If the question is "What are the benefits of fish oil?"
    Your response could be:
    "Fish oil is known for its rich content of Omega-3 fatty acids... The benefits of Fish Oil: Fish oil can delay or reduce the risk of cognitive decline.
    Fight Inflammation: Omega-3 has potent... || [Fish Oil | Omega-3 fatty acids | cognitive decline | Inflammation] || [Fish Oil]"
    If the question is "Can Coenzyme Q10 prevent Heart disease?"
    Your response could be:
    "Some studies have suggested that Coenzyme Q10 supplementation may have potential benefits for heart health... CoQ10 has antioxidant properties... ||
    [Coenzyme Q10 | heart health || antioxidant] || [Coenzyme Q10 | Heart disease]
    """

    completions = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": qa_prompt},
            {"role": "user", "content": message},
        ]
    )

    response = completions.choices[0].message.content.split(" || ")

    first_part = response[0]
    second_part = response[1]
    third_part = response[2]

    keywords_list_answer = re.search(r'\[([^]]*)\]', second_part).group(1).split(" | ")
    keywords_list_question = re.search(r'\[([^]]*)\]', third_part).group(1).split(" | ")

    return [first_part, keywords_list_answer, keywords_list_question]


def match_KG_nodes(entity_list, kg_nodes_embedding):
    nodes_list = []
    embedding_list = kg_nodes_embedding.embedding.values
    normalized_vector_list = normalize(np.vstack(embedding_list))
    for entity in entity_list:
        query_embedding = get_embedding(text=entity, model="text-embedding-ada-002")
        normalized_vector = normalize(np.asarray(query_embedding).reshape(1, -1))
        similarity_list = cosine_similarity_sklearn(normalized_vector, normalized_vector_list)[0]
        max_index = np.argmax(similarity_list)
        max_similarity = similarity_list[max_index]
        if max_similarity > 0.94:
            nodes_list.append([kg_nodes_embedding.CUI.values[max_index], kg_nodes_embedding.Name.values[max_index]])

    return nodes_list


def select_subgraph(cypher_statement):
    uri = neo4j_url
    driver = GraphDatabase.driver(uri, auth=("neo4j", "yuhou"))
    session = driver.session()
    neo4j_res = session.run(cypher_statement)

    nodes = []
    nodes_res = []
    rel = []
    rel_res = []

    node_id = 1
    rel_id = 1
    for i, record in enumerate(neo4j_res):
        path_nodes = record['path'].nodes
        path_rels = record['path'].relationships
        source_node_info = {"CUI": path_nodes[0]['CUI'], "Name": path_nodes[0]['Name'], "Label": path_nodes[0]['Label']}
        target_node_info = {"CUI": path_nodes[1]['CUI'], "Name": path_nodes[1]['Name'], "Label": path_nodes[1]['Label']}

        if source_node_info not in nodes:
            nodes.append(source_node_info)
            source_node_info_all = {'Node_ID': node_id, "CUI":  path_nodes[0]['CUI'], "Name": path_nodes[0]['Name'], "Label": path_nodes[0]['Label']}
            nodes_res.append(source_node_info_all)
            source_id = node_id
            node_id += 1
        else:
            source_idx = nodes.index(source_node_info)
            source_id = nodes_res[source_idx]['Node_ID']
        if target_node_info not in nodes:
            nodes.append(target_node_info)
            target_node_info_all = {'Node_ID': node_id, "CUI": path_nodes[1]['CUI'], "Name": path_nodes[1]['Name'], "Label": path_nodes[1]['Label']}
            nodes_res.append(target_node_info_all)
            target_id = node_id
            node_id += 1
        else:
            target_idx = nodes.index(target_node_info)
            target_id = nodes_res[target_idx]['Node_ID']

        rel_info = {"Source": source_id, "Target": target_id, "Type": path_rels[0]['Type']}
        if rel_info not in rel:
            rel.append(rel_info)
            rel_info_all = {'Relation_ID': rel_id, "Source": source_id, "Target": target_id, "Type": path_rels[0]['Type'], 'PubMed_ID':  path_rels[0]['PubMed_ID']}
            rel_res.append(rel_info_all)
            rel_id += 1
        else:
            rel_idx = rel.index(rel_info)
            rel_info_all = rel_res[rel_idx]
            rel_info_all['PubMed_ID'] = rel_info_all['PubMed_ID'] + " | " + path_rels[0]['PubMed_ID']

    return [nodes_res, rel_res]


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


def subgraph_type(cui, target_type):
    cypher_statement = "MATCH path=(sub:Node{CUI:\"" + cui + "\"})-[rel:Relation*1]-(obj:Node{Label:\"" + target_type + "\"}) RETURN path LIMIT 20"
    nodes, edges = select_subgraph(cypher_statement)

    return {"nodes": nodes, "edges": edges}


def visualization(node_list):
    res = []
    if len(node_list) == 1:
        cypher_statement = "MATCH path=(sub:Node{CUI:\"" + node_list[0][0] + "\"})-[rel:Relation*1]-(obj:Node) RETURN path LIMIT 20"
        nodes, edges = select_subgraph(cypher_statement)
        res.append({"nodes": nodes, "edges": edges})
    else:
        for i in range(len(node_list) - 1):
            current_entity = node_list[i][0]
            for j in range(i + 1, len(node_list)):
                next_entity = node_list[j][0]
                cypher_statement = "MATCH path=(sub:Node{CUI:\"" + current_entity + "\"})-[rel:Relation*1]-(obj:Node{CUI:\"" + next_entity + "\"}) RETURN path LIMIT 20"
                nodes, edges = select_subgraph(cypher_statement)
                if len(nodes) != 0:
                    res.append({"nodes": nodes, "edges": edges})
    if len(res) == 0:
        for i in range(len(node_list)):
            cypher_statement = "MATCH path=(sub:Node{CUI:\"" + node_list[i][0] + "\"})-[rel:Relation*1]-(obj:Node) RETURN path LIMIT 20"
            nodes, edges = select_subgraph(cypher_statement)
            res.append({"nodes": nodes, "edges": edges})

    return res


recommendation_space = []


def add_recommendation_space(entity_list):
    for entity in entity_list:
        cypher_statement = "MATCH path=(sub:Node{CUI:\"" + entity[0] + "\"})-[rel:Relation*1]-(obj:Node) RETURN path LIMIT 30"
        neighbor_list = summarize_neighbor_type(cypher_statement)
        for neighbor in neighbor_list:
            if [entity[1], neighbor] not in recommendation_space:
                recommendation_space.append([entity[0], entity[1], neighbor])


def generate_recommendation():
    res = ""
    if len(recommendation_space) > 0:
        for recommendation_candidate in recommendation_space:
            res += "I want know more information between " + recommendation_candidate[1] + " and " + recommendation_candidate[2] + ".\n"

    return res


def agent(kg_nodes_embedding, user_input, input_type):
    if input_type == "user_input":
        qa_response, keywords_list_answer, keywords_list_question = AI_respnse(user_input)
        print(qa_response)
        print(keywords_list_answer)
        print(keywords_list_question)
        nodes_list_answer = match_KG_nodes(keywords_list_answer, kg_nodes_embedding)
        nodes_list_question = match_KG_nodes(keywords_list_question, kg_nodes_embedding)
        print(nodes_list_answer)
        print(nodes_list_question)
        add_recommendation_space(nodes_list_question)
        print(recommendation_space)
        vis_res = visualization(nodes_list_answer)
        print(vis_res)
        recommendation = generate_recommendation()
        print(recommendation)
    if input_type == "follow_recommendation":
        # print(recommendation_space)
        selected_recommendation = recommendation_space.pop(user_input)
        # print(selected_recommendation)
        input_text = "I want know more information between " + selected_recommendation[1] + " and " + selected_recommendation[2] + "."
        print(input_text)
        qa_response, keywords_list_answer, keywords_list_question = AI_respnse(input_text)
        print(qa_response)
        vis_res = subgraph_type(selected_recommendation[0], selected_recommendation[2])
        print(vis_res)
        recommendation = generate_recommendation()
        print(recommendation)


def main():


    print("KG nodes embedding load complete...")
    # agent(kg_nodes_embedding, "Can Ginkgo biloba prevent Alzheimer‘s Disease?", "user_input")
    agent(kg_nodes_embedding, "What are the benefits of Coenzyme Q10?", "user_input")
    agent(kg_nodes_embedding, 1, "follow_recommendation")


if __name__ == '__main__':
    main()
