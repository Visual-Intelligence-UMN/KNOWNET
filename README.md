# KNOWNET: Guided Health Information Seeking from LLMs via Knowledge Graph Integration

This is the GitHub repository for our **IEEE VIS 2024 paper**,  
**“KNOWNET: Guided Health Information Seeking from LLMs via Knowledge Graph Integration”** ([Pre-Print](https://arxiv.org/abs/2407.13598)).  
This paper received the **Best Paper Honorable Mention** at IEEE VIS 2024.

 **Documentation:** [https://visual-intelligence-umn.github.io/KNOWNET/](https://visual-intelligence-umn.github.io/KNOWNET/)

![image](https://github.com/user-attachments/assets/dd1fe256-da49-44c0-8311-294802850f78)

---


## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/visual-intelligence-umn/KNOWNET.git
cd KNOWNET
```

### 2. Set up a Python virtual environment

```bash
python3 -m venv venv
source venv/bin/activate   # (on Windows: venv\Scripts\activate)
```

### 3. Install frontend dependencies

KNOWNET uses **React + TypeScript + Vite**.

```bash
pnpm install
```

*(If you don’t have pnpm installed, run `npm install -g pnpm` first.)*

### 4. Run the development server

```bash
pnpm run dev
```

The app will be served locally at:  
[http://localhost:5173](http://localhost:5173)


---

## Development Setup

If you are modifying the codebase:

### Install Frontend Dev Dependencies
```bash
pnpm install
pnpm run dev
```

### Install Backend Dev Dependencies
```bash
cd api
python3 index.py
```

Both servers must run concurrently in development mode.

---

## Backend Data and Database Setup

The KNOWNET backend relies on two primary data resources:

1. **Embedding Files** — Precomputed text embeddings used for entity and relation verification.  
   These embeddings are stored on the server and accessed through `embedding_utils.py` and `embeds.py`.  
   Developers reproducing the system locally can either:
   - Use existing OpenAI or local embedding models to regenerate these vectors from the source entity/relation files.
   - Or download the precomputed embedding files (available upon request or through institutional collaboration).

2. **Knowledge Graph Database (Neo4j)** —  
   The deployed version of KNOWNET connects to a Neo4j database hosted on **AWS EC2**, which contains the curated biomedical knowledge graph used for verification and recommendation.  
   The hosted instance supports the public demo and is **read-only** for external users.

### Setting Up a Local Neo4j Instance

To reproduce or extend KNOWNET with a custom knowledge graph:

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
   - Update these credentials in your local `.env` or configuration file (used by `verify.py` and `recommend.py`).

3. **Load Graph Data**
   - Import entity and relation CSV files into Neo4j via the **Neo4j Browser** or **cypher-shell**:
     ```cypher
     LOAD CSV WITH HEADERS FROM 'file:///entities.csv' AS row
     CREATE (:Entity {name: row.name, type: row.type});

     LOAD CSV WITH HEADERS FROM 'file:///relations.csv' AS row
     MATCH (a:Entity {name: row.source}), (b:Entity {name: row.target})
     CREATE (a)-[:RELATION {type: row.relation}]->(b);
     ```
   - Alternatively, adapt these commands to match your domain-specific data format.

4. **Generate or Import Embeddings**
   - Use `embedding_utils.py` to compute embeddings for all entities and relations:
     ```bash
     python3 api/embedding_utils.py
     ```
   - Store resulting vectors locally or in a connected S3 bucket.

### AWS Deployment (for Reference)

The hosted KNOWNET backend runs on **AWS EC2** with a connected Neo4j instance configured for read access.  
Developers replicating this deployment can follow a similar setup:
- Launch an EC2 instance (Ubuntu 22.04 or later).
- Install Neo4j, Flask, and dependencies listed in `requirements.txt`.
- Configure security groups to allow `bolt://` (7687) and HTTPS (443) traffic.
- Use Nginx or a similar reverse proxy for routing and SSL termination.

---

## Project Structure

The KNOWNET repository follows a modular full-stack architecture composed of a Python-based backend and a React + TypeScript frontend.  
Below is an overview of the top-level structure:

```
KNOWNET/
├── api/                     # Flask backend (embedding, verification, recommendation)
│   ├── embedding_utils.py
│   ├── embeds.py
│   ├── index.py
│   ├── recommend.py
│   └── verify.py
│
├── src/                     # React + TypeScript frontend
│   ├── assets/
│   ├── components/
│   ├── lib/
│   ├── main.tsx
│   ├── App.css
│   └── index.css
│
├── docs/                    # Documentation and setup guides
├── requirements.txt         # Python dependencies
├── package.json             # Frontend dependencies
├── vite.config.js           # Vite build configuration
├── tailwind.config.js       # TailwindCSS configuration
├── postcss.config.js        # PostCSS configuration
├── run_flask.sh             # Flask startup script
└── README.md
```

---

### `src/components/` — Component Description

This directory contains the primary interface modules that enable chat-based interaction, visualization, and dynamic user feedback.

| Component | Description |
|------------|--------------|
| **`App.tsx`** | The top-level container that integrates the chat interface, visualization panel, and overall application layout. |
| **`chat.tsx`, `chat-panel.tsx`, `chat-list.tsx`** | Manage chat session state, message rendering, and conversational layout structure. |
| **`chat-message.tsx`, `chat-message-action.tsx`** | Define the appearance and behavior of individual chat messages, including user interactions such as feedback or copy actions. |
| **`chat-slider.tsx`, `chat-scroll-anchors.tsx`** | Control streaming message presentation, auto-scrolling, and smooth viewport transitions during chat updates. |
| **`prompt-form.tsx`** | Handles user prompt input and manages message dispatch to the backend API. |
| **`recommendation_tray.tsx`** | Displays suggested follow-up queries, related entities, or recommended exploration paths generated by the backend. |
| **`empty-screen.tsx`** | Defines the placeholder state and introductory UI shown before a conversation begins. |
| **`vis-flow/`** | Implements the interactive visualization of knowledge graph entities and relations using React Flow. |
| **`markdown.tsx`** | Parses and renders model responses using Markdown and syntax highlighting for structured readability. |
| **`external-link.tsx`, `footer.tsx`, `providers.tsx`, `tailwind-indicator.tsx`** | Supporting components that manage layout, theming, developer utilities, and external linking behavior. |
| **`ui/`** | Reusable user interface primitives and styled components that provide consistent visual design across the application. |

---



## Citation

If you use or reference this project, please cite:

 
> Youfu Yan, Yu Hou, Yongkang Xiao, Rui Zhang, and Qianwen Wang. 2025.  
> **KNowNet: Guided Health Information Seeking from LLMs via Knowledge Graph Integration.**  
> *IEEE Transactions on Visualization and Computer Graphics*, 31(1), 547–557.  
> https://doi.org/10.1109/TVCG.2024.3456364

---

## KNOWNET v2: Guided Health Information Seeking via Web Search Verification & Edge Uncertainty

A follow-up version of KNOWNET explores **web search–based validation** as an alternative to static knowledge-graph integration.  
This prototype introduces **edge-level uncertainty quantification** to assess the reliability of model-generated relations in real time.

 **View KNOWNET v2 here:** [https://maurilaparva.github.io/prototype/](https://maurilaparva.github.io/prototype/)

---


