# Python Chat Service

A modular, production-grade FastAPI backend for the LangChain + Hugging Face chat application, featuring real-time token streaming and persistent storage via Convex.

## Architecture
This service uses a clean, maintainable architecture:
- `main.py`: FastAPI routing and request orchestration.
- `chat.py`: Orchestrates business logic between DB and LLM.
- `llm.py`: Configuration for LangChain and AI provider models.
- `db.py`: Infrastructure for Convex database interactions.

## Setup

1. **Virtual Environment:**
   ```bash
   cd python-service
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Variables:**
   Copy the `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```

4. **Running the Service:**
   ```bash
   ./venv/bin/uvicorn main:app --port 8000
   ```

## Why this architecture?
- **Separation of Concerns:** DB and LLM logic are decoupled from routing, improving testability.
- **Future-Proofing:** Using `llm.py` allows easy swapping of AI providers or frameworks without touching business logic.
- **Polyglot Design:** Demonstrates ability to integrate a Python backend with a TypeScript-native data layer (Convex).
