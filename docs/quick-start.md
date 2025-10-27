# Quick Start

Follow these steps to run **KNOWNET** locally on your computer.

---

## 1. Clone the repository

```bash
git clone https://github.com/visual-intelligence-umn/KNOWNET.git
cd KNOWNET
```

---

## 2. Set up a Python virtual environment

```bash
python3 -m venv venv
source venv/bin/activate   # (on Windows: venv\Scripts\activate)
```

---

## 3. Install frontend dependencies

KNOWNET uses **React + TypeScript + Vite**.

```bash
pnpm install
```

If you do not have `pnpm` installed, run:

```bash
npm install -g pnpm
```

---

## 4. Run the development server

```bash
pnpm run dev
```

The app will be served locally at:  
[http://localhost:5173](http://localhost:5173)

---

## 5. Development setup (optional)

If you plan to modify or develop the codebase further, you can run both the frontend and backend locally.

### Frontend

```bash
pnpm install
pnpm run dev
```

### Backend

```bash
cd api
python3 index.py
```

Both servers should run concurrently in development mode.

---

Your application should now be running locally. You can access it in your browser at [http://localhost:5173](http://localhost:5173).
