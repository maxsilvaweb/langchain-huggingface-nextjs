# LangChain + Hugging Face AI Infrastructure

![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Convex](https://img.shields.io/badge/convex-4F46E5?style=for-the-badge&logo=convex&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwind%20css-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![shadcn%2Fui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![Bun](https://img.shields.io/badge/bun-000000?style=for-the-badge&logo=bun&logoColor=white)
![Python](https://img.shields.io/badge/python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/fastapi-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/langchain-000000?style=for-the-badge&logo=langchain&logoColor=white)
![Hugging Face](https://img.shields.io/badge/hugging%20face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)

A polyglot AI application infrastructure combining **Next.js (App Router)**, **Convex** (reactive real-time database), **Python/FastAPI** (AI orchestration via LangChain + Hugging Face), **Tailwind v4**, and **shadcn/ui**.

## Architecture Overview

This project uses a decoupled, polyglot backend architecture:

- **Frontend** — Next.js (App Router) with React Server Components and client components for the chat surface.
- **State + Database** — Convex for schema-driven, real-time state management (conversation history, messages, AI-generated titles).
- **AI Backend** — Python (FastAPI + uvicorn with hot-reload) for streaming token support and multi-provider LLM orchestration via LangChain.
- **UI Layer** — Tailwind v4 with shadcn/ui components, a Claude-inspired "unboxed" chat layout, and frosted-glass composer.

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js App Router (src/app)                               │
│  ├── page.tsx                 ← landing / hero composer     │
│  ├── layout.tsx               ← providers + metadata        │
│  ├── chat/[conversationId]/   ← active chat surface        │
│  └── api/chat/title/          ← AI title generation         │
│         │                                                    │
│         ▼                                                    │
│  Convex (reactive queries / mutations)                      │
│  ├── convex/conversations.ts                                 │
│  └── convex/messages.ts                                      │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
          ▼
  Python FastAPI (python-service/main.py)
  ├── LangChain ChatOpenAI chain
  └── Hugging Face router endpoint (multi-model support)
```

## Getting Started

### Prerequisites

- Bun (preferred) or Node.js v18+
- Python 3.13+ (with venv support)
- Convex CLI installed (`bunx convex` or `npx convex`)

### Environment Configuration

Two environment files are required:

1. **Root `.env.local` (Convex + frontend):**
   - `CONVEX_DEPLOYMENT`
   - `NEXT_PUBLIC_CONVEX_URL`

2. **`python-service/.env` (AI backend):**
   - Copy `python-service/.env.example` → `python-service/.env`
   - Hugging Face / OpenAI / Anthropic / Google keys (as needed by your provider)

### Running the Project

1. **Start Convex + Python AI service (project root):**

```bash
chmod +x start.sh
./start.sh
```

`start.sh` boots Convex dev + uvicorn with `--reload` so Python changes hot-reload without a restart.

2. **Start the Next.js frontend (separate terminal):**

```bash
bun install     # or npm install
bun dev         # or npm run dev
```

Then visit `http://localhost:3000`.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                   Root layout, metadata + providers
│   ├── page.tsx                     Landing page (hero composer + model picker)
│   ├── chat/[conversationId]/
│   │   └── page.tsx                 Chat surface + sidebar layout
│   └── api/chat/title/route.ts      Conversation title generation (AI)
├── components/
│   ├── providers.tsx                Convex + Theme providers
│   ├── theme-toggle.tsx             Theme switcher
│   ├── chat/
│   │   ├── app-sidebar.tsx          Claude-style conversation sidebar
│   │   ├── chat-window.tsx          Unboxed chat layout with frosted composer
│   │   ├── message-bubble.tsx       User + AI message styles
│   │   └── model-selector.tsx       Model picker component
│   └── ui/                          shadcn/ui + ActionButton, AppDialog, etc.
├── hooks/
│   ├── use-chat.ts                  Per-conversation stream state
│   └── use-chat-session.ts          Empty-chat redirect logic
└── lib/
    ├── locale.ts                    APP_NAME / labels (single source of truth)
    ├── models.ts                    Model registry (HF IDs, display names)
    └── utils.ts                     cn() + helpers

convex/
├── conversations.ts                 Conversations CRUD (+ getFirstEmpty guard)
├── messages.ts                      Messages send + stream
└── schema.ts                        Table schemas

python-service/
├── main.py                          FastAPI service (LangChain + HF router)
└── services/
    ├── llm.py                       LLM provider setup
    ├── chat.py                      Chain definitions
    └── convex_client.py             Convex client for persistence
```

## Key UI/UX Patterns

### Layout & Composer

- **Unboxed chat surface** — Messages flow directly on the page background (no Card container). Sticky frosted-glass composer with `backdrop-blur` + gradient fade mask so messages bleed behind the input.
- **Smart scroll-to-bottom FAB** — Floating Action Button appears only when `scrollHeight - clientHeight > 80px` AND the user has scrolled up. Respects manual scroll during streaming (auto-scroll only snaps to bottom if they were already there).
- **Claude-style multiline composer** — Textarea with Enter-to-send, Shift+Enter for newlines, action buttons anchored bottom-right.
- **Mobile sidebar** — Drawer slides in below the header (offset `top-14` / 56px), not a full-screen overlay, so the header trigger remains clickable.

### State & Conversations

- **Auto AI titling** — First user message of a thread is summarized by the model via `/api/chat/title` and saved to the conversation row. Falls back to truncated first-message text if the title API fails.
- **Empty chat safeguard** — `getFirstEmpty` Convex query ensures "New Chat" reuses an existing message-less thread instead of creating duplicates; the New Chat button is actively _disabled_ (shows `Ban` hover indicator) when an empty thread exists.
- **Rename + Delete dialogs** — Shared `AppDialog` component + `ActionButton` themed variants (green/red/blue/amber/zinc) for consistent theming across actions.
- **Per-model selection** — Model ID tracked on the hero composer and active-chat ModelSelector.

### Accessibility

- All icon-only controls carry `aria-label` + `title` attributes for screen-readers and native hover tooltips.
- Disabled New Chat button shows a `Ban` hover-swap icon indicator (Plus spins away, `Ban` spins in) during creation/loading/empty-chat-exists states, with contextual tooltips explaining _why_ it's disabled.

## Testing the API

Verify the Python backend independently:

```bash
curl -X POST http://127.0.0.1:8000/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello!", "conversationId": "jd744024cd4bh502rk87zycgph8bzfz7"}'
```

## Why Polyglot?

While Next.js is excellent for frontend/API routing, the Python-based FastAPI backend exists for three reasons:

1. **Leverage the AI Ecosystem** — LangChain's Python libraries provide richer provider integrations and agentic orchestration.
2. **Separation of Concerns** — Heavy AI processing is decoupled from the UI, allowing independent scaling.
3. **Synchronized State** — Both TypeScript and Python are first-class Convex citizens writing to the same reactive DB.

## Development Commands

**Linting & Formatting (Python):**

```bash
cd python-service
./venv/bin/ruff check . --fix
./venv/bin/ruff format .
```

**Linting & Typechecking (Frontend):**

```bash
bun lint
bun typecheck
```
