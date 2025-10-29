# Run KNOWNET in Development Mode

This page explains how to run **KNOWNET** on your local computer in development mode.

First, clone the GitHub repository:

```bash
git clone https://github.com/Visual-Intelligence-UMN/KNOWNET.git
cd KNOWNET
```

---

## Backend

The backend is developed and tested with **Python 3.11**.

### 1. Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

*(On Windows: `venv\Scripts\activate`)*

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure backend data and Neo4j connection

Before starting the server, ensure the required data and database connections are properly configured.

KNOWNET relies on two primary backend resources:

1. **Embedding Files** — Precomputed text embeddings used for entity and relation verification.  
   These are accessed by `embedding_utils.py` and `embeds.py`.  
   Developers running KNOWNET locally can regenerate these vectors using OpenAI or a local embedding model applied to their own entity/relation data.

2. **Knowledge Graph Database (Neo4j)** —  
   The production instance connects to a **read-only Neo4j database hosted on AWS EC2** that contains the curated biomedical knowledge graph.  
   For local or custom use, create your own Neo4j database and update the connection information in a local `.env` file as shown below.

#### Example `.env` configuration

```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=<your-password>
OPENAI_API_KEY=<your-api-key>
```

---

## Setting Up a Local Neo4j Instance

To reproduce or extend KNOWNET locally with a custom knowledge graph:

1. **Install Neo4j Community or AuraDB**
   - Local setup: [https://neo4j.com/download/](https://neo4j.com/download/)
   - Cloud setup (recommended for collaboration): [https://neo4j.com/cloud/aura/](https://neo4j.com/cloud/aura/)

2. **Create a New Database**
   - Configure a database (e.g., `knownet_db`) and note your connection credentials:
     ```
     NEO4J_URI=bolt://localhost:7687
     NEO4J_USER=neo4j
     NEO4J_PASSWORD=<your-password>
     ```
   - Add these credentials to your `.env` file. The backend scripts (`verify.py` and `recommend.py`) automatically read from this configuration.

3. **Load Graph Data**
   - Import entity and relation CSV files into Neo4j via the **Neo4j Browser** or **cypher-shell**:
     ```cypher
     LOAD CSV WITH HEADERS FROM 'file:///entities.csv' AS row
     CREATE (:Entity {name: row.name, type: row.type});

     LOAD CSV WITH HEADERS FROM 'file:///relations.csv' AS row
     MATCH (a:Entity {name: row.source}), (b:Entity {name: row.target})
     CREATE (a)-[:RELATION {type: row.relation}]->(b);
     ```
   - Adapt these commands to match your data schema if needed.

4. **Generate or Import Embeddings**
   - Use `embedding_utils.py` to compute embeddings for all entities and relations:
     ```bash
     python3 api/embedding_utils.py
     ```
   - Store the resulting vectors locally or in a connected S3 bucket.

---

### 4. Start the backend server

Once the dependencies and data connections are configured, start the backend:

```bash
cd api
python3 index.py
```

The backend server should now be running at `http://localhost:5328`.

---

### AWS Deployment (for Reference)

The hosted KNOWNET backend runs on **AWS EC2** with a connected Neo4j instance configured for read-only access.  
Developers replicating this deployment can follow a similar setup:

- Launch an EC2 instance (Ubuntu 22.04 or later).
- Install Neo4j, Flask, and dependencies from `requirements.txt`.
- Configure security groups to allow `bolt://` (7687) and HTTPS (443) traffic.
- Use Nginx or another reverse proxy for routing and SSL termination.

---

## Frontend

The frontend interface is developed with **React + TypeScript + Vite** and tested using **Node v20.9.0** on Chrome.

### 1. Install dependencies

```bash
pnpm install
```

If you do not have `pnpm` installed, run:

```bash
npm install -g pnpm
```

### 2. Launch the frontend in development mode

```bash
pnpm run dev
```

The frontend will be available at:  
[http://localhost:5173](http://localhost:5173)

---

## Verifying Your Setup

Once both servers are running:

- The **backend** should be accessible at `http://localhost:5328`
- The **frontend** should be accessible at `http://localhost:5173`

Open your browser and navigate to **KNOWNET** to verify that both components are communicating correctly in development mode.
