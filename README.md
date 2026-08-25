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

## Screenshots

### Login
![Login](public/screenshots/login.jpg)

### Chat with RAG
![Chat with RAG](public/screenshots/chat.jpg)

### Knowledge Base & RAG Documents
![Knowledge Base](public/screenshots/knowledge-base-rag.jpg)

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

You have two options for local development:

#### Option A: Native (faster, hot-reload)

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

#### Option B: Docker Compose (matches production)

```bash
# Copy env files
cp .env.example .env.local        # Fill in your keys
cp python-service/.env.example python-service/.env

# Build and start both services
docker compose up --build
```

This runs the same containers that deploy to GCP. The web app is on `http://localhost:3000` and the API on `http://localhost:8000`. Note: you still need Convex running separately (`bunx convex dev`) since it's a managed service.

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
├── main.py                          FastAPI entrypoint (chat, documents, health)
├── constants.py                     Centralized config (chunk sizes, models, limits)
├── interfaces.py                    Protocol contracts (SOLID abstractions)
├── providers.py                     LLM provider factory (OpenAI, Anthropic, Google, HF)
├── services.py                      RAG implementations (chunker, embedders, vector store)
├── container.py                     Dependency injection container
├── guardrails.py                    Input validation + injection detection
├── logging_config.py                Structlog JSON logging with trace IDs
├── chat.py                          Chat chain with RAG retrieval
├── llm.py                           LLM setup with provider routing
├── db.py                            Convex client for document persistence
└── evals/                           RAG retrieval + response grounding tests
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

## RAG (Retrieval-Augmented Generation)

This project includes a full RAG pipeline that allows the AI to answer questions using your uploaded documents.

### How RAG Works

1. **Ingest Documents** — Upload text via the API or UI. Content is chunked (500 chars, 50 overlap) and embedded using `all-MiniLM-L6-v2` or `text-embedding-3-small` (384 dims).
2. **Store Embeddings** — Chunks are stored in Convex's built-in vector database with 384-dimensional embeddings.
3. **Retrieve Context** — When you ask a question, the system finds the most relevant chunks using vector similarity search.
4. **Augmented Response** — Retrieved context is injected into the LLM prompt, and the AI cites sources in its response.

### RAG API Endpoints

**Ingest text document:**
```bash
curl -X POST http://127.0.0.1:8000/documents/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <convex-token>" \
  -d '{
    "text": "Your document content here...",
    "source": "document_name.txt",
    "metadata": {"category": "healthcare"}
  }'
```

**Ingest from URL:**
```bash
curl -X POST http://127.0.0.1:8000/documents/ingest-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <convex-token>" \
  -d '{"url": "https://example.com/article"}'
```

**List documents:**
```bash
curl http://127.0.0.1:8000/documents \
  -H "Authorization: Bearer <convex-token>"
```

### Disabling RAG

Pass `useRag: false` in the chat request to skip context retrieval:
```json
{"message": "Hello", "conversationId": "...", "useRag": false}
```

---

## Observability with LangSmith

This project integrates with [LangSmith](https://smith.langchain.com) for LLM observability (free tier available).

### Setup

Add to `python-service/.env`:
```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT=langchain-rag-chat
```

### What You Get

- **Full trace visualization** of every LangChain call
- **Token usage, latency, cost** tracking
- **Eval datasets** for hallucination detection
- **Zero code changes** — just env vars

---

## Production Hardening

### Input Guardrails

- **Length limits** — Messages capped at 4,000 characters
- **Injection detection** — Blocks common prompt injection patterns
- **Rate limiting** — Configurable via `slowapi`

### Output Guardrails

- **Confidence scoring** — Based on retrieval similarity scores
- **Source citation** — LLM prompted to cite retrieved sources
- **Uncertainty acknowledgment** — Model admits when context is insufficient

### Structured Logging

JSON-formatted logs with trace IDs for production observability:
```json
{"event": "chat_request", "trace_id": "a1b2c3d4", "conversation_id": "...", "use_rag": true}
```

Enable JSON logs in production:
```env
JSON_LOGS=true
LOG_LEVEL=INFO
```

### Health Endpoints

```bash
# Liveness
curl http://127.0.0.1:8000/health

# Readiness (checks Convex + RAG pipeline)
curl http://127.0.0.1:8000/health/ready \
  -H "Authorization: Bearer <convex-token>"
```

---

## Evaluation Harness

Run RAG and response quality tests:

```bash
cd python-service
pytest evals/ -v
```

Test categories:
- `test_rag_retrieval.py` — Chunking, embedding, retrieval accuracy
- `test_response_grounding.py` — Source citation, hallucination detection

---

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

**Run Evals:**

```bash
cd python-service
pytest evals/ -v
```

---

## Docker & Local Containers

Both services are containerised. Run the full stack with Docker Compose:

```bash
# Copy env vars (fill in your values first)
cp .env.local .env

# Build and run both services
docker compose up --build
```

- **Web** (Next.js): http://localhost:3000
- **API** (Python FastAPI): http://localhost:8000

### Dockerfiles

- `Dockerfile` — Multi-stage build for Next.js (standalone output, Node.js-based for cross-platform compatibility)
- `python-service/Dockerfile` — Python 3.13 slim image with uvicorn
- `docker-compose.yml` — Orchestrates both services with env var injection

---

## Deployment: GCP Cloud Run with Terraform

The infrastructure is defined as code using Terraform. Both services deploy to Google Cloud Run as separate, independently scalable containers.

**Live deployment:**
- Web: https://rag-chat-web-yqaahhf3aa-ew.a.run.app
- API: https://rag-chat-api-yqaahhf3aa-ew.a.run.app

### Architecture

```
User → Cloud Run (Next.js) → Cloud Run (Python API) → Convex (DB + Vector Search)
                                         ↓
                                   Secret Manager (API keys)
                                   LangSmith (Observability)
```

### Prerequisites

1. [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed
2. [Terraform](https://developer.hashicorp.com/terraform/install) installed
3. A GCP project with billing enabled
4. Docker installed

### Deploy

```bash
# 1. Authenticate with GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Configure Terraform variables
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 3. Run the deploy script (builds images, pushes to Artifact Registry, applies Terraform)
cd ..
chmod +x deploy.sh
./deploy.sh
```

### What Terraform provisions

| Resource | Purpose |
|----------|---------|
| Artifact Registry | Stores Docker images |
| Cloud Run: `rag-chat-web` | Next.js frontend (0-3 instances, 512Mi, Node.js runtime) |
| Cloud Run: `rag-chat-api` | Python API (0-3 instances, 2Gi, startup probe on /health) |
| Secret Manager | Stores all API keys (Clerk, OpenAI, HuggingFace, etc.) |
| Service Account | IAM identity for Cloud Run to access secrets |
| IAM policies | Web service is public; API service is internal |

### Why GCP Cloud Run

- **Scale to zero** — No traffic, no cost (perfect for a take-home/demo)
- **Container-native** — Just push Docker images, no server management
- **Per-service scaling** — The Python API can scale independently from the UI
- **Secret Manager integration** — API keys never touch the filesystem

---

## RAG/LLM Approach & Decisions

### Chunking Strategy

I chose recursive character text splitting with 500-character chunks and 50-character overlap. Chunking is the process of breaking documents into smaller pieces so vector search can find specific information rather than matching entire documents.

- **500 chars** hits a sweet spot: small enough to be precise (one topic per chunk), large enough to carry meaningful context
- **50 char overlap** ensures sentences aren't cut in half at chunk boundaries, so context isn't lost between chunks
- I considered larger chunks (1000+) but they mixed topics and diluted retrieval accuracy
- I considered smaller chunks (200) but they lost too much surrounding context for the LLM to answer well
- Recursive splitting (paragraphs > sentences > words) keeps semantic boundaries intact

### Embedding Model

Primary: `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions via HuggingFace Inference API)
Fallback: `text-embedding-3-small` (OpenAI, 384 dimensions) and `text-embedding-004` (Google, 384 dimensions)

- MiniLM-L6-v2 is fast, free, and produces 384-dim vectors which keeps storage lean
- I built a `FallbackEmbedder` that automatically tries OpenAI, then HuggingFace, then Google, so RAG keeps working even when one provider's credits are depleted
- All three providers use 384 dimensions to match the Convex vector index schema, meaning no schema change is needed when switching

### LLM Selection

Multi-provider via factory pattern: HuggingFace, OpenAI, Anthropic, Google.

- The factory pattern (`LLMProviderFactory`) lets users switch models from the UI without backend changes
- Each provider is a separate class implementing `ILLMProvider`, following Open/Closed Principle
- Default is HuggingFace (router API) since it's free to start with
- Users can switch to GPT-4o, Claude, or Gemini from the model selector in the chat UI

### Vector Database

Convex's built-in vector search.

- I chose Convex because its real-time database is perfect for chat (messages update live without polling)
- The vector search is built into the same database, so no separate vector DB to manage
- I considered pgvector but wanted to learn something new, and Convex was recommended by Theo (theo.gg)
- Documents are shared across all authenticated users (one knowledge base, not per-user silos)

### Orchestration Framework

LangChain for the Python AI layer.

- LangChain gives us streaming, prompt templating, and provider abstractions out of the box
- The `ChatPromptTemplate` handles system prompt + history + user input cleanly
- LangSmith integration comes for free since we're already in the LangChain ecosystem

### Prompt Engineering & Context Management

The RAG system prompt instructs the AI to prioritize retrieved context, cite sources as `[Source N]`, and admit when it doesn't know something rather than hallucinate.

- Context is injected as a formatted block with source names and relevance scores
- Chat history is passed via `MessagesPlaceholder` so the LLM has conversation context
- If RAG retrieval fails (API down, credits depleted), the chat falls back to the base prompt with a clear warning logged

### Guardrails

- Input validation: 4000 character limit on user messages
- Prompt injection detection: flags common injection patterns
- Confidence scoring: filters retrieval results below 0.6 similarity threshold
- RAG failures are non-fatal: the chat continues without context rather than crashing

### Quality Controls

- Eval harness with test categories for retrieval accuracy and response grounding
- Tests verify chunking behavior, embedding dimensions, and source citation format
- Response grounding eval cases check for hallucination and irrelevant context usage

### Observability

- **LangSmith**: Full trace of every RAG pipeline step (embedding, retrieval, prompt, LLM response) with timing and token counts
- **Structlog**: JSON-formatted logs with trace IDs for request correlation
- **Health endpoints**: `/health` (liveness) and `/health/ready` (readiness checks for embedder, LLM provider, and Convex connectivity)

---

## Key Technical Decisions

1. **Polyglot architecture (TypeScript + Python)** — Next.js handles the UI and auth, Python handles AI orchestration. Each language does what it's best at. The communication is via a simple HTTP API, keeping the boundary clean.

2. **SOLID refactoring with Protocol interfaces** — Split the RAG pipeline into focused classes (Chunker, Embedder, VectorStore, Retriever, Ingester) with Python Protocol interfaces and a dependency injection container. This makes the code testable and provider-agnostic.

3. **Shared knowledge base** — Documents are visible to all authenticated users, not siloed per user. This makes sense for a knowledge base use case where the value is in collective information.

4. **Multi-provider embedding fallback** — If one provider's credits run out, the system automatically tries the next. This prevented an outage when HuggingFace credits depleted during development.

5. **Next.js API routes as proxy** — The frontend never calls the Python backend directly. All requests go through Next.js API routes which handle auth and forwarding. This keeps the Python backend internal.

---

## Engineering Standards

**Followed:**
- SOLID principles (Single Responsibility, Open/Closed, Interface Segregation, Dependency Inversion)
- Protocol-based interfaces for dependency injection
- Factory pattern for LLM provider selection
- Structured logging with trace IDs
- Environment-based configuration
- Type checking (TypeScript `tsc --noEmit` and Python type hints)
- Git conventional commits
- Containerisation with Dockerfile + docker-compose
- Infrastructure as Code with Terraform (GCP Cloud Run)

**Skipped (acknowledged):**
- **Full unit test suite** — Eval harness covers RAG-specific tests, but the SOLID service classes don't have dedicated unit tests yet.
- **CI/CD pipeline** — No automated CI; tests and linting run manually.
- **PDF/document parsing** — Text-only ingestion for MVP. PDF support would require adding a parser like PyMuPDF or unstructured.

---

## How I Used AI Tools

I used AI coding assistants (Factory Droid) as a pair programmer throughout this project. My approach:

- **AI suggested, I decided** — The AI wrote code and proposed solutions, but I reviewed every change, understood what it did, and made the final call on architecture and design decisions
- **Iterative refinement** — I'd ask for a feature, review the output, then ask for adjustments (e.g., "make the button green", "tighten the spacing", "group chunks by source")
- **Learning tool** — When I didn't understand a concept (like chunking or polyglot architecture), I asked the AI to explain it before committing to an approach
- **What I controlled** — Product direction, UX decisions, feature priorities, what to include vs skip for the MVP
- **What I let AI handle** — Boilerplate code, repetitive patterns, CSS styling tweaks, debugging stack traces

My do's: Review every line before committing, understand the "why" behind decisions, ask for explanations when unsure.
My don'ts: Don't blindly accept code without understanding it, don't let AI make product decisions, don't skip verification (type checks, manual testing).

---

## What I'd Do Differently With More Time

1. **Add PDF and document parsing** — Currently text-only. I'd add PyMuPDF or `unstructured` for PDF/DOCX support, which is what most real RAG use cases need.

2. **Full test suite** — Unit tests for every SOLID class with mock providers, integration tests for the full RAG pipeline, and automated evals running in CI.

3. **Better retrieval** — Add hybrid search (keyword + vector), re-ranking with a cross-encoder, and query expansion for better recall.

4. **User feedback loop** — Thumbs up/down on AI responses, feeding back into LangSmith for evaluation and prompt improvement.

5. **CI/CD pipeline** — Automated builds, tests, and deploys on push via GitHub Actions to Cloud Run.
