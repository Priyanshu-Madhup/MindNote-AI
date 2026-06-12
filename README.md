# 🧠 MindNote AI

> **Turn any document into knowledge.** MindNote AI is an intelligent study assistant that helps you understand documents, generate insights, and interact with your notes through AI-powered chat.

![MindNote AI](frontend/public/MindNote.png)

---

## ✨ Features

- 🤖 **AI Chat** — Real-time streaming chat powered by Groq (LLaMA 3.3 70B)
- 🎨 **Premium Dark UI** — Gold-accent glassmorphism design with smooth animations
- 🔐 **Authentication** — Full Clerk auth with Google, Microsoft, Notion sign-in
- 📒 **Notebook Sidebar** — Organize your study materials
- 🎙️ **Studio Panel** — Audio Overview, Slide Deck, Mind Map, Flashcards, Quiz, Report
- ⚡ **Typewriter Effect** — Character-by-character response rendering
- 📱 **Responsive** — Full mobile support with collapsible panels

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TailwindCSS |
| **Animations** | Framer Motion (`motion/react`) |
| **3D Background** | Three.js |
| **Auth** | Clerk (`@clerk/react`, `@clerk/ui`) |
| **Backend** | FastAPI (Python) |
| **AI / LLM** | Groq API (OpenAI-compatible), LLaMA 3.3 70B |
| **Streaming** | Server-Sent Events (SSE) |
| **Icons** | Lucide React, Material Symbols |
| **Fonts** | Epilogue, Manrope (Google Fonts) |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.12+
- [Groq API key](https://console.groq.com/keys) (free)
- [Clerk account](https://clerk.com) (free)

### 1. Clone

```bash
git clone https://github.com/Priyanshu-Madhup/MindNote-AI.git
cd MindNote-AI
```

### 2. Backend

```bash
cd backend
# Create .env file
echo "GROQ_API_KEY=your_groq_key_here" > .env
# Install dependencies
pip install -r requirements.txt
# Run
python main.py
# → http://localhost:8000
```

### 3. Frontend

```bash
cd frontend
# Create env file
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxx" > .env.local
echo "VITE_BACKEND_URL=http://localhost:8000" >> .env.local
# Install dependencies
npm install
# Run
npm run dev
# → http://localhost:5173
```

---

## 🌐 Deployment

### Backend — Render

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Env Var | `GROQ_API_KEY=your_key` |

### Frontend — Vercel

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Env Vars | `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_BACKEND_URL` |

---

## 📁 Project Structure

```
MindNote-AI/
├── backend/
│   ├── main.py           # FastAPI app, Groq SSE streaming
│   ├── requirements.txt  # Python dependencies
│   └── .env              # GROQ_API_KEY (gitignored)
└── frontend/
    ├── public/
    │   └── MindNote.png  # App logo / favicon
    ├── src/
    │   ├── main.jsx       # React entry, ClerkProvider setup
    │   ├── App.jsx        # Main app, chat logic, layout
    │   ├── LandingPage.jsx# Marketing landing page
    │   ├── Background3D.jsx# Three.js animated background
    │   └── index.css      # Global styles + Clerk overrides
    ├── index.html
    └── .env.local         # Frontend env vars (gitignored)
```

---

## 🔑 Environment Variables

### `frontend/.env.local`
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
VITE_BACKEND_URL=http://localhost:8000
```

### `backend/.env`
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
```

---

## 📜 License

Apache-2.0 © 2024 Priyanshu Madhup
