# MindNote AI

> An AI-powered notebook platform for research, learning, and knowledge synthesis.

MindNote AI is a modern React web application that lets you organize your knowledge into notebooks and generate rich AI-powered outputs — audio podcasts, mind maps, flashcards, quizzes, slide decks, and more — directly from your documents and web sources.

---

## ✨ Features

- **Notebooks** — Organize documents, PDFs, and web sources into focused workbooks
- **AI Chat** — Ask questions across all your notebooks in a unified chat interface
- **Audio Podcasts** — Generate natural, narrated audio overviews from your documents
- **Mind Maps** — Visualize concepts and relationships interactively
- **Flashcards & Quiz Mode** — AI-generated study aids from any source
- **Slide Decks** — Auto-generate presentation-ready slides
- **Website Analysis** — Import and chat with any web content
- **Studio Panel** — A dedicated workspace for all generated outputs

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 19](https://react.dev/) |
| Build Tool | [Vite 8](https://vite.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Animations | [Motion (Framer Motion)](https://motion.dev/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Linting | [ESLint 10](https://eslint.org/) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v18+**
- [npm](https://www.npmjs.com/) **v9+**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/mindnote-ai.git
cd mindnote-ai/mindnote_ai

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

The app will be available at **http://localhost:5173** with hot module replacement enabled.

### Build for Production

```bash
npm run build
```

Output is generated in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 📁 Project Structure

```
mindnote_ai/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images and media
│   ├── App.jsx          # Root component (Sidebar, Main, RightPanel)
│   ├── App.css          # Component-level styles
│   ├── index.css        # Global styles & Tailwind directives
│   └── main.jsx         # React entry point
├── index.html           # HTML shell
├── vite.config.js       # Vite configuration
├── eslint.config.js     # ESLint configuration
└── package.json
```

---

## 🎨 Design System

MindNote AI uses a warm neutral dark palette:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0C0C0C` | App shell |
| Surface | `#141414` / `#1C1C1C` | Cards, panels |
| Border | `#2A2A2A` | Dividers |
| Accent | `#D4C5A9` | Primary actions, highlights |
| Text Primary | `#E5E2E1` | Body copy |
| Text Muted | `#6B6B6B` | Labels, captions |

---

## 📜 License

This project is licensed under the **Apache-2.0 License** — see the source files for details.
