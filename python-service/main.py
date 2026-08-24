# This is the main file for our Python backend service.
# It uses FastAPI to create an API endpoint that handles incoming chat requests.
# Features: RAG retrieval, structured logging, input guardrails, health checks.
#
# Architecture: Follows SOLID principles with dependency injection.
# See interfaces.py for contracts, services.py for implementations,
# and container.py for dependency wiring.

import time
from typing import Any, Optional

import chat as chat_service
import db as convex
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from container import get_container
from guardrails import validate_input_or_raise_http
from logging_config import get_logger, set_trace_id

# Initialize structured logger
log = get_logger("main")

# Initialize the FastAPI application
app = FastAPI(
    title="LangChain RAG API",
    description="AI chat API with RAG (Retrieval-Augmented Generation) support",
    version="1.0.0",
)


# ============================================================================
# MIDDLEWARE
# ============================================================================

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Add trace ID and log request/response."""
    trace_id = set_trace_id()
    start_time = time.time()
    
    log.info(
        "request_started",
        method=request.method,
        path=request.url.path,
        client=request.client.host if request.client else "unknown",
    )
    
    response = await call_next(request)
    
    duration_ms = (time.time() - start_time) * 1000
    log.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round(duration_ms, 2),
    )
    
    response.headers["X-Trace-ID"] = trace_id
    return response


# ============================================================================
# REQUEST MODELS
# ============================================================================

class ChatRequest(BaseModel):
    """Request body for the chat endpoint."""
    message: str = Field(..., min_length=1, max_length=4000)
    conversationId: str
    modelName: Optional[str] = None
    provider: str = "huggingface"
    useRag: bool = Field(default=True, description="Whether to use RAG for context retrieval")


class IngestTextRequest(BaseModel):
    """Request body for text document ingestion."""
    text: str = Field(..., min_length=1, max_length=100000)
    source: str = Field(..., description="Source identifier (filename, title, etc.)")
    metadata: Optional[dict[str, Any]] = None


class IngestUrlRequest(BaseModel):
    """Request body for URL ingestion."""
    url: str = Field(..., pattern=r"^https?://")
    metadata: Optional[dict[str, Any]] = None


def get_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    return token


# Define a POST route at "/chat" to receive chat messages
@app.post("/chat")
async def chat(request: ChatRequest, authorization: str | None = Header(default=None)):
    """
    Handle chat messages with optional RAG context retrieval.
    
    The message is validated, relevant documents are retrieved (if RAG enabled),
    and the response is streamed back to the client.
    """
    try:
        convex_token = get_bearer_token(authorization)
        
        # Validate input (guardrails)
        validated_message = validate_input_or_raise_http(request.message)
        
        log.info(
            "chat_request",
            conversation_id=request.conversationId,
            model=request.modelName,
            provider=request.provider,
            use_rag=request.useRag,
            message_length=len(validated_message),
        )
        
        # Get the stream generator from the chat service
        # NOTE: Message persistence is handled by the React client
        async_gen = chat_service.get_chat_stream(
            validated_message,
            request.conversationId,
            convex_token,
            request.modelName,
            request.provider,
            use_rag=request.useRag,
        )

        async def stream_generator():
            """Stream response chunks to the client."""
            async for chunk in async_gen:
                yield chunk.encode("utf-8")

        return StreamingResponse(stream_generator(), media_type="text/event-stream")
    
    except HTTPException:
        raise
    except Exception as e:
        log.error("chat_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DOCUMENT INGESTION ENDPOINTS
# ============================================================================

@app.post("/documents/ingest")
async def ingest_text(
    request: IngestTextRequest,
    authorization: str | None = Header(default=None),
):
    """
    Ingest a text document into the vector store for RAG retrieval.
    
    The text is automatically chunked, embedded, and stored in Convex.
    Uses dependency injection via ServiceContainer for SOLID compliance.
    """
    try:
        convex_token = get_bearer_token(authorization)
        
        # Get document ingester from DI container
        container = get_container()
        ingester = container.get_document_ingester(convex_token)
        
        doc_ids = await ingester.ingest(
            text=request.text,
            source=request.source,
            metadata=request.metadata,
        )
        
        log.info(
            "document_ingested",
            source=request.source,
            chunk_count=len(doc_ids),
        )
        
        return {
            "success": True,
            "message": f"Ingested {len(doc_ids)} chunks",
            "chunk_count": len(doc_ids),
            "document_ids": doc_ids,
        }
    except HTTPException:
        raise
    except Exception as e:
        log.error("ingest_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/documents/ingest-url")
async def ingest_url(
    request: IngestUrlRequest,
    authorization: str | None = Header(default=None),
):
    """
    Fetch content from a URL and ingest it into the vector store.
    
    Extracts text from HTML, chunks it, and stores embeddings.
    """
    try:
        import httpx
        from bs4 import BeautifulSoup
        
        convex_token = get_bearer_token(authorization)
        
        # Fetch URL content
        async with httpx.AsyncClient() as client:
            response = await client.get(request.url, follow_redirects=True)
            response.raise_for_status()
        
        # Extract text from HTML
        soup = BeautifulSoup(response.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        
        # Use DI container for ingestion
        container = get_container()
        ingester = container.get_document_ingester(convex_token)
        
        metadata = request.metadata or {}
        metadata["source_url"] = request.url
        
        doc_ids = await ingester.ingest(
            text=text,
            source=request.url,
            metadata=metadata,
        )
        
        log.info(
            "url_ingested",
            url=request.url,
            chunk_count=len(doc_ids),
        )
        
        return {
            "success": True,
            "message": f"Ingested {len(doc_ids)} chunks from {request.url}",
            "chunk_count": len(doc_ids),
            "document_ids": doc_ids,
            "source_url": request.url,
        }
    except HTTPException:
        raise
    except Exception as e:
        log.error("url_ingest_error", url=request.url, error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents")
async def list_documents(authorization: str | None = Header(default=None)):
    """List all documents for the current user."""
    try:
        convex_token = get_bearer_token(authorization)
        docs = convex.list_documents(convex_token)
        count = convex.get_document_count(convex_token)
        
        return {
            "documents": docs,
            "total_count": count,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Error in list_documents endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents/suggest-queries")
async def suggest_queries(authorization: str | None = Header(default=None)):
    """
    Generate suggested queries from the knowledge base using the LLM.
    
    Fetches document snippets, asks the LLM to produce questions a user
    might ask that the documents could answer.
    """
    try:
        convex_token = get_bearer_token(authorization)
        docs = convex.list_documents(convex_token)

        if not docs:
            return {"queries": []}

        # Build a compact summary of the knowledge base (first 200 chars per doc)
        summaries = []
        for doc in docs[:20]:  # Cap at 20 to keep prompt small
            source = doc.get("metadata", {}).get("source", "Unknown")
            snippet = doc.get("text", "")[:200]
            summaries.append(f"[{source}]: {snippet}")

        kb_summary = "\n\n".join(summaries)

        # Use LLM to generate questions
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        container = get_container()
        provider = container.get_llm_provider()
        model = provider.get_model()

        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a helpful assistant. Based on the following knowledge base "
             "documents, generate 5 concise questions that a user could ask which "
             "these documents would help answer. Return ONLY the questions, one per "
             "line, numbered 1-5. No explanations or extra text."),
            ("user", "Knowledge base:\n\n{kb_summary}"),
        ])

        chain = prompt | model | StrOutputParser()
        result = chain.invoke({"kb_summary": kb_summary})

        # Parse lines into a clean list
        queries = []
        for line in result.strip().splitlines():
            # Strip numbering like "1. " or "1) "
            cleaned = line.strip()
            for prefix in range(1, 10):
                for fmt in (f"{prefix}. ", f"{prefix}) ", f"{prefix} "):
                    if cleaned.startswith(fmt):
                        cleaned = cleaned[len(fmt):]
                        break
            if cleaned:
                queries.append(cleaned)

        log.info("suggested_queries", doc_count=len(docs), query_count=len(queries))

        return {"queries": queries[:7]}
    except HTTPException:
        raise
    except Exception as e:
        log.error("suggest_queries_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    authorization: str | None = Header(default=None),
):
    """Delete a document by ID."""
    try:
        convex_token = get_bearer_token(authorization)
        convex.delete_document(doc_id, convex_token)
        
        return {"success": True, "message": "Document deleted"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Error in delete_document endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HEALTH ENDPOINTS
# ============================================================================

@app.get("/health")
async def health():
    """Basic liveness check."""
    return {"status": "healthy"}


@app.get("/health/ready")
async def health_ready(authorization: str | None = Header(default=None)):
    """
    Readiness check - verifies service components.
    
    Returns details about the service state using DI container.
    """
    checks = {
        "convex": False,
        "embedder": False,
        "llm_provider": False,
    }
    
    try:
        container = get_container()
        
        # Check Convex connectivity (if token provided)
        if authorization:
            try:
                convex_token = get_bearer_token(authorization)
                convex.get_document_count(convex_token)
                checks["convex"] = True
            except Exception as e:
                checks["convex_error"] = str(e)
        else:
            checks["convex"] = "skipped (no auth)"
        
        # Check embedder initialization
        try:
            embedder = container.get_embedder()
            _ = embedder.embed("test")
            checks["embedder"] = True
        except Exception as e:
            checks["embedder_error"] = str(e)
        
        # Check LLM provider
        try:
            provider = container.get_llm_provider()
            checks["llm_provider"] = True
            checks["llm_provider_name"] = provider.provider_name
        except Exception as e:
            checks["llm_provider_error"] = str(e)
        
        all_ok = (
            checks.get("convex") is True
            and checks.get("embedder") is True
            and checks.get("llm_provider") is True
        )
        
        return {
            "status": "ready" if all_ok else "degraded",
            "checks": checks,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "checks": checks,
        }
