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

### 3. Start the backend server

```bash
cd api
python3 index.py
```

The backend server should now be running at `http://localhost:5328`.

---

## Frontend

The frontend interface is developed with **React + TypeScript + Vite**, and tested using **Node v20.9.0** on Chrome.

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

- The **backend** should be accessible at: `http://localhost:5328`
- The **frontend** should be accessible at: `http://localhost:5173`

You can now open your browser and interact with **KNOWNET** in development mode.
