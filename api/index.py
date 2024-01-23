from flask import Flask, jsonify, request

import os
import openai

app = Flask(__name__)
openai.api_key = os.getenv("OPENAI_API_KEY")

@app.route("/api/python", methods=["GET"])
def hello_world():
    return "<p>Hello, I am testing flask</p>"


# Retrieve Chat Session
@app.route("/api/chat/<chat_id>", methods=["GET"])
def retrieve_chat_session(chat_id):
    # Mock data
    response = {
        "status": "success",
        "message": "Chat session retrieved successfully",
        "data": {
            "id": chat_id,
            "messages": [
                {"id": "1", "content": "Hello", "role": "user", "timestamp": "2023-01-22T12:00:00"},
                {"id": "2", "content": "Hi there!", "role": "assistant", "timestamp": "2023-01-22T12:01:00"}
            ],
            "nodes": [
                {"id": "node1", "label": "Node 1", "position": {"x": 0, "y": 0}, "style": {"backgroundColor": "#ffcc00"}}
            ]
        }
    }
    return jsonify(response)

# Create/Update Chat Session
@app.route("/api/chat", methods=["GET"])
def create_update_chat_session():
    # data = request.json
    # # Here, you would normally process the data and persist it.
    # # Returning mock response
    # response = {
    #     "status": "success",
    #     "message": "Chat session created/updated successfully",
    #     "data": data  # Echoing back the received data for now
    # }
    # return jsonify(response)

    #testing with fake data
    data = {
        "id": "chat_id",
        "messages": [
            {"id": "1", "content": "Hello", "role": "user", "timestamp": "2023-01-22T12:00:00"},
            {"id": "2", "content": "Hi there!", "role": "assistant", "timestamp": "2023-01-22T12:01:00"}
        ],
        "nodes": [
            {"id": "node1", "label": "Node 1", "position": {"x": 0, "y": 0}, "style": {"backgroundColor": "#ffcc00"}}
        ]
    }
    response = {
        "status": "success",
        "message": "Chat session created/updated successfully",
        "data": data  # Echoing back the received data for now
    }
    return jsonify(response)

# Process Chat Message
@app.route("/api/chat/process", methods=["POST"])
def process_chat_message():
    data = request.json
    # Normally, you would send this to OpenAI API and process the response.
    # Mock response
    response = {
        "status": "success",
        "message": "Message processed successfully",
        "data": {
            "response": {
                "id": "response_id",
                "content": "This is a mock response from the chatbot",
                "role": "assistant",
                "timestamp": "2023-01-22T12:05:00"
            },
            "newNode": {
                "id": "node2",
                "label": "New Node",
                "position": {"x": 100, "y": 100},
                "style": {"backgroundColor": "#00ccff"}
            }
        }
    }
    return jsonify(response)

# Save/Retrieve Node Data
@app.route("/api/nodes", methods=["GET", "POST"])
def node_data():
    if request.method == "POST":
        data = request.json
        # Process and save the data
        message = "Node data saved successfully"
    else:
        # Retrieve and return node data
        data = [
            {"id": "node1", "label": "Node 1", "position": {"x": 0, "y": 0}, "style": {"backgroundColor": "#ffcc00"}}
        ]
        message = "Node data retrieved successfully"

    response = {
        "status": "success",
        "message": message,
        "data": {
            "nodes": data
        }
    }
    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)
