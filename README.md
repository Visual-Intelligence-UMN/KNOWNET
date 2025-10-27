# KNOWNET: Guided Health Information Seeking from LLMs via Knowledge Graph Integration

This is the GitHub repository for our **IEEE VIS 2024 paper**,  
**“KNOWNET: Guided Health Information Seeking from LLMs via Knowledge Graph Integration”** ([Pre-Print](https://arxiv.org/abs/2407.13598)).  
This paper received the **Best Paper Honorable Mention** at IEEE VIS 2024.

📘 **Documentation:** [https://visual-intelligence-umn.github.io/KNOWNET/](https://visual-intelligence-umn.github.io/KNOWNET/)

![image](https://github.com/user-attachments/assets/dd1fe256-da49-44c0-8311-294802850f78)

---

## KNOWNET v2: Guided Health Information Seeking via Web Search Verification & Edge Uncertainty

A follow-up version of KNOWNET explores **web search–based validation** as an alternative to static knowledge-graph integration.  
This prototype introduces **edge-level uncertainty quantification** to assess the reliability of model-generated relations in real time.

🔗 **View KNOWNET v2 here:** [https://maurilaparva.github.io/prototype/](https://maurilaparva.github.io/prototype/)

---

## 🧭 Quick Start

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
👉 [http://localhost:5173](http://localhost:5173)


---

## ⚙️ Development Setup

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



## 📄 Citation

If you use or reference this project, please cite:

 
> *KNOWNET: Guided Health Information Seeking from LLMs via Knowledge Graph Integration.*  
> IEEE VIS 2024 — Best Paper Honorable Mention.  
> [arXiv:2407.13598](https://arxiv.org/abs/2407.13598)

---


