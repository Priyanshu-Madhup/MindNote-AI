# MindNote AI — Complete Technical Documentation

> **Last Updated:** June 2026 | **Version:** 1.0.0  
> This document is a living reference — updated after every iteration.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Complete Tech Stack](#2-complete-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Backend — `backend/main.py`](#4-backend--backendmainpy)
5. [Frontend Entry Point — `src/main.jsx`](#5-frontend-entry-point--srcmainjsx)
6. [Main App Component — `src/App.jsx`](#6-main-app-component--srcappjsx)
7. [Landing Page — `src/LandingPage.jsx`](#7-landing-page--srclandingpagejsx)
8. [3D Background — `src/Background3D.jsx`](#8-3d-background--srcbackground3djsx)
9. [Global Styles — `src/index.css`](#9-global-styles--srcindexcss)
10. [API Reference](#10-api-reference)
11. [Authentication Flow](#11-authentication-flow)
12. [Chat Streaming Architecture](#12-chat-streaming-architecture)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Environment Variables](#14-environment-variables)
15. [Data Flow Diagram](#15-data-flow-diagram)

---

## 1. Project Overview

MindNote AI is a full-stack AI-powered study assistant web application. Users can authenticate, access a notebook workspace, and chat with an AI assistant that streams responses in real-time using a typewriter effect.

**Core user journey:**
1. User visits the landing page (`LandingPage.jsx`) — a fully animated marketing page
2. User signs in via Clerk (Google, Microsoft, email, etc.)
3. On successful auth, user is redirected to the main app (`App.jsx`) — no page reload
4. User types a question in the chat bar
5. Message is sent to the FastAPI backend (`main.py`) at `/chat/stream`
6. Backend calls Groq's LLM API and streams tokens back as SSE
7. Frontend drips characters onto screen at 18ms/char (typewriter effect)

---

## 2. Complete Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| `react` | 18.x | UI component library |
| `vite` | 8.x | Build tool & dev server |
| `tailwindcss` | 4.x | Utility-first CSS framework |
| `motion` (`framer-motion`) | latest | Animations (`motion.div`, `AnimatePresence`) |
| `three` | latest | 3D WebGL background on landing page |
| `@clerk/react` | latest | Authentication hooks & UI components |
| `@clerk/ui` | latest | Clerk component version pinning (prevents structural CSS breakage) |
| `lucide-react` | latest | SVG icon library |

### Backend
| Package | Version | Purpose |
|---|---|---|
| `fastapi` | latest | Python web framework |
| `uvicorn[standard]` | latest | ASGI server (runs FastAPI) |
| `openai` | latest | OpenAI-compatible SDK (used to call Groq) |
| `python-dotenv` | latest | Loads `.env` file into `os.environ` |
| `pydantic` | bundled with FastAPI | Request/response data validation |

### External Services
| Service | Purpose |
|---|---|
| **Groq Cloud** | LLM inference — ultra-fast `openai/gpt-oss-20b` or `llama-3.3-70b-versatile` |
| **Clerk** | User authentication — sign-in, sign-up, session management |
| **Vercel** | Frontend hosting (static site + CDN) |
| **Render** | Backend hosting (Python web service) |
| **Google Fonts** | Typography — Epilogue (headings), Manrope (body) |
| **Material Symbols** | Icon font for landing page cards |

---

## 3. Repository Structure

```
MindNote-AI/
├── README.md                    # Quick start guide
├── detailed_readme.md           # This file — full technical documentation
│
├── backend/
│   ├── main.py                  # FastAPI application (entire backend)
│   ├── requirements.txt         # Python package list
│   ├── .env                     # GROQ_API_KEY (gitignored)
│   └── __pycache__/             # Python bytecode cache
│
└── frontend/
    ├── index.html               # HTML shell — favicon, fonts, meta tags
    ├── package.json             # npm dependencies
    ├── vite.config.js           # Vite build configuration
    ├── tailwind.config.js       # Tailwind configuration
    ├── .env.local               # Frontend env vars (gitignored)
    │
    └── src/
        ├── main.jsx             # React root — ClerkProvider, appearance config
        ├── App.jsx              # Main application shell (sidebar, chat, panels)
        ├── LandingPage.jsx      # Marketing landing page with 3D background
        ├── Background3D.jsx     # Three.js WebGL canvas component
        └── index.css            # Global CSS + Tailwind directives + Clerk overrides
    │
    └── public/
        └── MindNote.png         # App logo (used as favicon, OG image, in-app logo)
```

---

## 4. Backend — `backend/main.py`

Full file: 119 lines. This is the **entire backend**.

### Imports & Setup

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from openai import OpenAI          # OpenAI SDK used with Groq's base_url
from dotenv import load_dotenv
import os, json

load_dotenv()                      # loads backend/.env into os.environ
```

### Groq Client Initialization

```python
client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",   # Groq is OpenAI-compatible
)
MODEL = "openai/gpt-oss-20b"
```

Groq is 100% compatible with the OpenAI Python SDK — just changing `base_url` is enough to point it at Groq instead of OpenAI. No special Groq library needed.

### System Prompt

```python
SYSTEM_PROMPT = (
    "You are MindNote AI, an intelligent study and knowledge assistant. "
    "You help users understand documents, generate insights, create study materials, "
    "and answer questions across their notebooks. Be concise, helpful, and insightful."
)
```

This is prepended to every conversation. It defines the AI's persona and behavior.

### CORS Middleware

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",      # Vite uses next port if 5173 is taken
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://mindnote-ai.vercel.app",   # Production Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

CORS is required because the browser enforces same-origin policy. Without this, `fetch()` calls from the Vite dev server (`localhost:5173`) to FastAPI (`localhost:8000`) would be blocked.

### Pydantic Schemas

```python
class Message(BaseModel):
    role: str        # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]   # Full conversation history
```

FastAPI uses Pydantic to automatically validate and parse the JSON request body. If the body doesn't match, FastAPI returns a 422 error automatically.

### `GET /health`

```python
@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL}
```

Simple health check endpoint. Used by Render to verify the service is alive.

### `POST /chat/stream` — The Core Endpoint

```python
@app.post("/chat/stream")
async def chat_stream(body: ChatRequest):
```

**What it does:** Receives the full conversation history, calls Groq with streaming enabled, and yields each token as a Server-Sent Event.

**Step by step:**

```python
# 1. Build conversation with system prompt prepended
conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
conversation += [m.model_dump() for m in body.messages]

# 2. Inner generator function (lazy — only runs when iterated)
def generate():
    stream = client.chat.completions.create(
        model=MODEL,
        messages=conversation,
        stream=True,          # enables streaming
        temperature=0.7,      # creativity (0=deterministic, 1=creative)
        max_tokens=2048,      # max response length
    )
    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            # Format as SSE: "data: {json}\n\n"
            payload = json.dumps({"token": delta.content})
            yield f"data: {payload}\n\n"
    
    yield "data: [DONE]\n\n"   # signal stream completion

# 3. Return as streaming HTTP response
return StreamingResponse(
    generate(),
    media_type="text/event-stream",
    headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",   # prevents nginx from buffering SSE
    },
)
```

**SSE format** — each message is:
```
data: {"token": " hello"}\n\n
data: {"token": " world"}\n\n
data: [DONE]\n\n
```

### `if __name__ == "__main__":`

```python
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

Allows running with `python main.py` directly. `reload=True` watches for file changes and auto-restarts. On Render, the start command is `uvicorn main:app --host 0.0.0.0 --port $PORT` (no reload in production).

---

## 5. Frontend Entry Point — `src/main.jsx`

Full file: 214 lines.

### Purpose
This is the React application entry point. It:
1. Reads the Clerk publishable key from env
2. Configures the complete Clerk appearance (dark gold theme)
3. Wraps the app in `<ClerkProvider>`
4. Mounts React to the DOM

### Clerk Publishable Key

```javascript
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local');
}
```

`import.meta.env` is Vite's way of accessing environment variables. Only variables prefixed with `VITE_` are exposed to the browser.

### `clerkAppearance` Object

This is a large configuration object (~190 lines) that completely overrides Clerk's default white/light theme with a dark gold aesthetic. Key sections:

**`layout`** — Sets the MindNote logo on all Clerk auth pages:
```javascript
layout: {
  logoImageUrl:  '/MindNote.png',
  logoPlacement: 'outside',   // renders above the card
  logoLinkUrl:   '/',         // clicking logo goes to home
},
```

**`variables`** — CSS custom properties for the entire Clerk UI:
```javascript
variables: {
  colorPrimary:        '#c9a84c',   // gold
  colorBackground:     '#131313',   // near-black
  colorText:           '#f0ece0',   // warm white
  colorInputBackground:'#1e1e1e',
  borderRadius:        '8px',
  fontFamily:          '"Manrope", sans-serif',
}
```

**`elements`** — Per-component style overrides. Covers:
- `card` — sign-in/sign-up card (dark background, gold box-shadow glow)
- `socialButtonsIconButton` — Google/Microsoft/Notion buttons (dark, bordered)
- `formButtonPrimary` — submit button (gold background, black text, uppercase)
- `userButtonPopoverCard` — the popover when clicking avatar in sidebar
- `userProfile*` — the full "Manage Account" page
- `navbar*` — left sidebar within account management
- `menuButton/menuList/menuItem` — `...` three-dot action menus
- `badge` — "Primary" email badge
- `breadcrumbs*` — navigation breadcrumbs
- `alertText` — error messages (red)

### App Mount

```javascript
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/" 
      appearance={clerkAppearance}
      ui={ui}           // @clerk/ui pins component version to prevent CSS breakage
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);
```

`ui={ui}` from `@clerk/ui` pins Clerk's internal component DOM structure so the custom CSS selectors in `index.css` won't break when Clerk deploys component updates. Without this, Clerk shows a "Structural CSS detected" console warning.

---

## 6. Main App Component — `src/App.jsx`

Full file: 693 lines. Contains all the main application UI and chat logic.

### Constants

```javascript
const MOBILE_BP = 768;   // breakpoint for mobile detection (px)
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const CHAR_DELAY = 18;   // ms between typewriter characters
```

### Helper Functions

#### `getGreeting()`
```javascript
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};
```
Returns a time-appropriate greeting shown on the welcome screen.

### Sub-Components

#### `NotebookIcon`
Thin wrapper around `<BookOpen>` from lucide-react. Accepts `filled` prop to toggle `fill-current`.

---

#### `SidebarProfile`
**Clerk hook used:** `useUser()`  
**Purpose:** Shows the logged-in user's avatar, name, and email in the sidebar footer.

```javascript
const { user, isLoaded } = useUser();
```

- While Clerk loads (`!isLoaded`): renders an animated skeleton (pulsing gray bars)
- Once loaded: renders `<UserButton>` (Clerk's avatar component) + name + email
- Clicking `<UserButton>` opens Clerk's popover with "Manage account" and "Sign out"

---

#### `Sidebar`
**Props:** `{ isOpen, onClose, isMobile }`  
**Animation:** Framer Motion spring slide-in from left (`x: -280 → 0`)

Contains:
- **Brand logo** — `MindNote.png` + "MindNote AI" text
- **Mobile close button** — `X` icon (only visible on mobile)
- **"New Notebook" button** — gold CTA button (currently UI-only)
- **Notebook list** — 4 hardcoded demo notebooks with active state styling
- **`<SidebarProfile />`** — real user data at bottom

The active notebook shows a gold left border and expand chevron (`ChevronDown`). Inactive notebooks show `ChevronRight`.

---

#### `FeatureCard`
**Props:** `{ icon, label, desc }`  
Renders a dark card with a Lucide icon, feature name, and description. Used in `WelcomeSection`. Has hover effects (lighter background, gold border glow, icon scale).

---

#### `RightPanel`
**Props:** `{ isOpen, onClose, isMobile }`  
**Animation:** Spring slide-in from right (`x: 320 → 0`)

Contains two sections:

1. **Studio Grid (2×3)** — 6 tool buttons:
   - Audio Overview (`Headphones`)
   - Slide Deck (`Airplay`)
   - Mind Map (`GitBranch`)
   - Flashcards (`Layers`)
   - Quiz (`GraduationCap`)
   - Report (`FileText`)

2. **Recent Outputs** — 3 hardcoded demo items showing previous generations

All tools are currently UI-only (no functionality implemented yet).

---

#### `WelcomeSection`
Shows the main welcome screen when no chat has started yet. Contains:
- Dynamic greeting (`getGreeting()`)
- 8-card feature grid showing MindNote's capabilities
- Fade-in animation (`opacity: 0 → 1, y: 16 → 0`)

---

#### `ThinkingIndicator`
Shown while waiting for the AI's first token. **NOT a chat bubble** — it's a bare animated text element:

```javascript
// "THINKING" with a gold shimmer sweep gradient
style={{
  background: 'linear-gradient(90deg, #D4C5A9 0%, #f0e6cc 40%, #D4C5A9 80%)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  animation: 'shimmer 1.6s linear infinite',
}}
```

Plus 3 tiny bouncing dots (3×3px, staggered 0.18s each).

---

#### `ChatMessage`
**Props:** `{ msg }` where `msg = { role, content, streaming? }`

- **User messages** — gold `#D4C5A9` bubble, right-aligned, no avatar
- **AI messages** — dark `#1C1C1C` bubble with border, left-aligned, MindNote logo (6×6)
- **Streaming cursor** — when `msg.streaming === true`, shows a blinking `|` cursor:
  ```javascript
  <span className="inline-block w-[2px] h-[1em] bg-[#D4C5A9] ml-0.5 align-middle animate-pulse" />
  ```
- Empty streaming bubbles are filtered out in the render to prevent flash

---

### Main `App()` Component

#### Auth State (Clerk)

```javascript
const { isLoaded, isSignedIn } = useAuth();
const [showLanding, setShowLanding] = useState(false);

useEffect(() => {
  if (isLoaded) {
    setShowLanding(!isSignedIn);
  }
}, [isLoaded, isSignedIn]);
```

**Three render states:**
1. `!isLoaded` → loading spinner (pulsing MindNote logo on black screen) — avoids landing page flash
2. `showLanding === true` → `<LandingPage />`
3. `showLanding === false` → main app

#### Responsive Layout

```javascript
useEffect(() => {
  const checkMobile = () => {
    const mobile = window.innerWidth < MOBILE_BP;   // < 768px
    setIsMobile(mobile);
    if (mobile) {
      setSidebarOpen(false);
      setRightPanelOpen(false);
    } else {
      setSidebarOpen(true);
      setRightPanelOpen(true);
    }
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

On mobile: both panels start closed (drawers). On desktop: both start open (fixed sidebars). `motion.main` has animated `marginLeft`/`marginRight` that adjust when panels open/close.

#### Chat State

```javascript
const [messages, setMessages] = useState([]);      // full conversation history
const [inputText, setInputText] = useState('');
const [isThinking, setIsThinking] = useState(false);
const [hasChat, setHasChat] = useState(false);     // whether to show chat vs welcome

// Refs (don't cause re-renders)
const bottomRef = useRef(null);        // auto-scroll sentinel element
const inputRef  = useRef(null);        // focus after AI responds
const charQueue = useRef([]);          // typewriter character queue
const isTyping  = useRef(false);       // is drip() currently running?
const typingTarget = useRef(null);     // which message index to write to
```

#### `sendMessage()` — The Core Chat Function

`useCallback` with dependencies `[inputText, messages, isThinking]`.

**Full flow:**

```
1. Guard: if empty input or already thinking → return

2. Build userMsg = { role: 'user', content: text }
   Append to history array

3. setMessages(history)          → user bubble appears
   setInputText('')               → clear input
   setHasChat(true)               → switch from welcome to chat view
   setIsThinking(true)            → "THINKING" indicator appears

4. Add empty assistant placeholder:
   { role: 'assistant', content: '', streaming: true }
   assistantIdx = history.length  → remember its position

5. fetch(`${BACKEND}/chat/stream`, {
     method: 'POST',
     body: JSON.stringify({ messages: history })
   })

6. Response is a ReadableStream. Use:
   reader = res.body.getReader()
   decoder = new TextDecoder()

7. Typewriter drip engine:
   const drip = (idx) => {
     if (queue empty) → isTyping = false, return
     char = charQueue.shift()
     
     if firstChar:
       setIsThinking(false)   // "THINKING" disappears, AI bubble appears
       firstChar = false
     
     setMessages(prev => append char to prev[idx].content)
     setTimeout(() => drip(idx), 18)   // recurse after 18ms
   }

8. SSE read loop:
   while (true) {
     { done, value } = await reader.read()
     if done: break
     
     buffer += decoder.decode(value, { stream: true })
     lines = buffer.split('\n')
     
     for each line:
       strip "data: " prefix
       if "[DONE]": continue
       parse JSON → { token }
       push each char of token to charQueue
       if !isTyping: start drip()
   }

9. catch: show error message in assistant bubble
10. finally: strip streaming flag, refocus input
```

---

## 7. Landing Page — `src/LandingPage.jsx`

Full file: 674 lines. The marketing/auth page.

### Key Components

#### `MarqueeCard`
A glassmorphism feature card used in the infinite horizontal marquee. Properties:
- `minWidth/maxWidth: 300px`
- `backdrop-filter: blur(14px)` — frosted glass effect
- `border: 1px solid rgba(255,255,255,0.07)`
- Gold hover state (border + background change)
- Transform (scale) is driven externally by RAF loop, not CSS

#### `MarqueeFeatures`
Infinite scrolling feature showcase. Uses a **requestAnimationFrame (RAF)** loop for smooth animation:

```javascript
const applyScales = () => {
  // For each card, calculate distance from viewport center
  // Cards at center → scale: 1.06 (MAX_SCALE)
  // Cards at edges  → scale: 0.58 (MIN_SCALE)
  // Linear interpolation between min and max
  
  if (!pausedRef.current) {
    // auto-scroll: translate the track
  }
  rafRef.current = requestAnimationFrame(applyScales);
};
```

This creates a "focus zoom" effect where the card closest to the center is largest.

#### `LandingPage` Component
Exported default. Receives `{ onEnterApp }` prop.

**Auth detection:**
```javascript
const { isSignedIn } = useAuth();
useEffect(() => {
  if (isSignedIn) onEnterApp();   // auto-redirect if already signed in
}, [isSignedIn]);
```

**Sections:**
1. **Sticky Navbar** — logo, nav links (Features, Studio), Login/Sign Up or "Go to App" + UserButton
2. **Hero Section** — animated headline, typewriter subtitle, CTA buttons
3. **Features Marquee** (`#features`) — infinite scroll of feature cards
4. **Studio Section** (`#studio`) — AI capabilities showcase
5. **CTA Section** — final sign-up call-to-action
6. **Footer** — logo, nav links, copyright

---

## 8. 3D Background — `src/Background3D.jsx`

Uses **Three.js** to render an animated 3D particle/geometry background visible behind the landing page.

Key implementation details:
- Renders to a `<canvas>` element positioned fixed behind all content
- Responds to scroll position via the `scrollRef` prop
- Uses `requestAnimationFrame` for the render loop
- `THREE.WebGLRenderer` with `alpha: true` for transparent background
- `THREE.Clock` is used (deprecated — should migrate to `THREE.Timer`)

---

## 9. Global Styles — `src/index.css`

### Tailwind Directives
```css
@import "tailwindcss";
```

### Custom CSS Animations
```css
@keyframes shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
```
Used by `ThinkingIndicator` for the gold gradient sweep on "THINKING" text.

### Clerk Dark Theme Overrides
~180 lines of `.cl-*` class overrides to match MindNote's dark gold aesthetic. Key selectors:
- `.cl-card` — sign-in card background
- `.cl-navbar` — account management sidebar
- `.cl-navbarSectionHeader` — "Account" heading
- `.cl-navbar *` — catch-all for all navbar text
- `.cl-userButtonPopoverCard` — avatar click popover
- `.cl-formButtonPrimary` — submit buttons
- `.cl-menuList` — dropdown menus
- `.cl-badge` — email "Primary" badge

> **Note:** Child-tag selectors like `.cl-navbar h2` have been removed per Clerk's "structural CSS" warning. Only parent class selectors are used now.

---

## 10. API Reference

### Backend API (`https://mindnote-ai.onrender.com`)

#### `GET /health`
Health check.
```json
Response: { "status": "ok", "model": "openai/gpt-oss-20b" }
```

#### `POST /chat/stream`
Stream AI chat completion.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Explain neural networks" },
    { "role": "assistant", "content": "Neural networks are..." },
    { "role": "user", "content": "Give me a simpler explanation" }
  ]
}
```

**Response:** `text/event-stream` (SSE)
```
data: {"token": "Sure"}
data: {"token": "!"}
data: {"token": " Neural"}
...
data: [DONE]
```

**Error response:**
```
data: {"error": "error message here"}
data: [DONE]
```

---

## 11. Authentication Flow

### Sign-In Flow
```
User clicks "Log In"
  → Clerk modal opens (SignInButton mode="modal")
  → User selects method (Google / email / etc.)
  → Clerk handles OAuth or email verification
  → Clerk sets session cookie
  → useAuth() hook returns isSignedIn: true
  → LandingPage useEffect fires → onEnterApp()
  → showLanding = false → main App renders
```

### Refresh / Return Visit Flow (No Flash)
```
Page loads
  → App renders → isLoaded: false → loading spinner shows
  → Clerk SDK initializes asynchronously (reads cookie)
  → isLoaded: true, isSignedIn: true
  → useEffect: setShowLanding(false)
  → Main app renders directly (no landing page shown)
```

### Sign-Out Flow
```
User clicks avatar → "Sign out"
  → Clerk clears session
  → afterSignOutUrl="/" navigates to root
  → isSignedIn: false → showLanding: true → LandingPage shown
```

---

## 12. Chat Streaming Architecture

```
Browser                     FastAPI                    Groq
  │                            │                          │
  │──POST /chat/stream ────────►│                          │
  │  { messages: [...] }       │──chat.completions.create─►│
  │                            │  stream=True              │
  │                            │◄──chunk 1 (token)─────────│
  │◄──data: {"token":"Hello"}──│                           │
  │                            │◄──chunk 2 (token)─────────│
  │◄──data: {"token":" world"}─│                           │
  │                            │◄──chunk n ────────────────│
  │◄──data: [DONE]─────────────│                           │
```

### Typewriter Engine Detail

Tokens from SSE arrive in bursts (multiple chars per chunk). The drip engine ensures they display one-by-one:

```
SSE arrives: "Hello, how"     → charQueue = ['H','e','l','l','o',',',' ','h','o','w']
18ms timer fires → display 'H'
18ms timer fires → display 'e'
...
SSE arrives: " are you?"     → charQueue appended: [' ','a','r','e',' ','y','o','u','?']
drip continues seamlessly
```

This creates a smooth typewriter effect regardless of when SSE chunks arrive.

---

## 13. Deployment Architecture

```
┌──────────────────────────────────────────────┐
│  User Browser                                 │
│  https://mindnote-ai.vercel.app               │
└──────────────────┬───────────────────────────┘
                   │ HTTPS
                   ▼
┌──────────────────────────────────────────────┐
│  Vercel (CDN)                                 │
│  • Serves built React app (dist/)             │
│  • Global edge network                        │
│  • Auto-deploys on git push to main           │
└──────────────────┬───────────────────────────┘
                   │ fetch() POST /chat/stream
                   │ HTTPS + CORS
                   ▼
┌──────────────────────────────────────────────┐
│  Render (Web Service)                         │
│  https://mindnote-ai.onrender.com             │
│  • Python 3.12 runtime                        │
│  • uvicorn main:app --host 0.0.0.0            │
│  • Auto-deploys on git push to main           │
└──────────────────┬───────────────────────────┘
                   │ HTTPS
                   ▼
┌──────────────────────────────────────────────┐
│  Groq Cloud API                               │
│  https://api.groq.com/openai/v1              │
│  • openai/gpt-oss-20b model                   │
│  • Ultra-fast inference (~500 tok/sec)        │
└──────────────────────────────────────────────┘

Auth flow (separate):
Browser ←──────────────────── Clerk Cloud
         HTTPS SDK calls       (session management)
```

---

## 14. Environment Variables

### `frontend/.env.local` (never committed)
| Variable | Example | Description |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_abc...` | Clerk publishable key (dev or prod) |
| `VITE_BACKEND_URL` | `http://localhost:8000` | Backend API base URL |

### `backend/.env` (never committed)
| Variable | Example | Description |
|---|---|---|
| `GROQ_API_KEY` | `gsk_abc...` | Groq Cloud API key |

### Vercel Dashboard Environment Variables
Same as `frontend/.env.local` but with production values:
- `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_xxx`
- `VITE_BACKEND_URL` = `https://mindnote-ai.onrender.com`

### Render Dashboard Environment Variables
- `GROQ_API_KEY` = your Groq key

---

## 15. Data Flow Diagram

```
User Types Message
      │
      ▼
sendMessage() called
      │
      ├─► Append user bubble to messages[]
      ├─► Add empty assistant placeholder (streaming: true)
      ├─► setIsThinking(true) → "THINKING" animates
      │
      ▼
fetch POST /chat/stream
      │
      ▼
ReadableStream reader created
      │
      ▼
SSE tokens arrive in chunks
      │
      ▼
Each token split into chars → pushed to charQueue[]
      │
      ▼
drip() runs every 18ms:
  • On first char: setIsThinking(false) → "THINKING" fades out
  • Pops one char from charQueue
  • setMessages() → appends char to assistant bubble
  • setTimeout(drip, 18) → recurse
      │
      ▼
SSE "[DONE]" received → stream ends
      │
      ▼
finally block:
  • Remove streaming:true flag (hides cursor)
  • inputRef.focus() → ready for next message
```

---

## Changelog

| Date | Change |
|---|---|
| Jun 2026 | Initial implementation — FastAPI backend, Groq SSE streaming, chat UI |
| Jun 2026 | Clerk auth integration with custom dark gold appearance |
| Jun 2026 | MindNote.png logo added — favicon, OG image, sidebar, landing page |
| Jun 2026 | Typewriter character drip engine (18ms/char) |
| Jun 2026 | ThinkingIndicator — bare text with shimmer, no bubble |
| Jun 2026 | Auth flash fix — `useAuth()` in App, loading spinner state |
| Jun 2026 | CORS fix — added ports 5173-5175 + Vercel production URL |
| Jun 2026 | `@clerk/ui` integration — pins component versions, removes CSS warning |
| Jun 2026 | Deployed: Render (backend) + Vercel (frontend) |
