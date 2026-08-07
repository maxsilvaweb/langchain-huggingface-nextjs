
# LangChain + Hugging Face AI with Convex & Python BE using FastAPI

![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Convex](https://img.shields.io/badge/convex-4F46E5?style=for-the-badge&logo=convex&logoColor=white)
![Python](https://img.shields.io/badge/python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/fastapi-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/langchain-000000?style=for-the-badge&logo=langchain&logoColor=white)
![Hugging Face](https://img.shields.io/badge/hugging%20face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)

A modern, polyglot AI application leveraging the reactive power of **Convex** and the robust AI orchestration capabilities of **Python (FastAPI & LangChain)**.

## Architecture Overview
This project uses a decoupled, polyglot backend architecture:

*   **Frontend:** Next.js (React) for a reactive, real-time UI.
*   **Database:** Convex for schema-driven, real-time state management.
*   **AI Backend:** Python (FastAPI) for advanced AI orchestration, streaming token support, and multi-provider integration (Hugging Face, OpenAI, Anthropic, Google).

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.13+)
- Convex CLI installed

### Environment Configuration
You need to configure two sets of environment variables:

1. **Frontend (`.env.local` at root):**
   - Copy required Convex and API keys from your provider dashboard.

2. **Backend (`python-service/.env`):**
   - Copy the `python-service/.env.example` to `python-service/.env` and populate it with the same API keys required by your providers.

### Running the Project
We have simplified the startup process. From the project root, simply run:

```bash
chmod +x start.sh
./start.sh
# LangChain + Hugging Face AI with Convex & FastAPI

![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Convex](https://img.shields.io/badge/convex-4F46E5?style=for-the-badge&logo=convex&logoColor=white)
![Python](https://img.shields.io/badge/python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/fastapi-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/langchain-000000?style=for-the-badge&logo=langchain&logoColor=white)
![Hugging Face](https://img.shields.io/badge/hugging%20face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)

A modern, polyglot AI application leveraging the reactive power of **Convex** and the robust AI orchestration capabilities of **Python (FastAPI & LangChain)**.

## Architecture Overview
This project uses a decoupled, polyglot backend architecture:

*   **Frontend:** Next.js (React) for a reactive, real-time UI.
*   **Database:** Convex for schema-driven, real-time state management.
*   **AI Backend:** Python (FastAPI) for advanced AI orchestration, streaming token support, and multi-provider integration (Hugging Face, OpenAI, Anthropic, Google).

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.13+)
- Convex CLI installed

### Environment Configuration
You need to configure two sets of environment variables:

1. **Frontend (`.env.local` at root):**
   - Copy required Convex and API keys from your provider dashboard.

2. **Backend (`python-service/.env`):**
   - Copy the `python-service/.env.example` to `python-service/.env` and populate it with the same API keys required by your providers.

### Running the Project
We have simplified the startup process. From the project root, simply run:

```bash
chmod +x start.sh
./start.sh
