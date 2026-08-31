# This file handles all interactions with our database, which is Convex.
# It sets up the connection and provides functions to read and write messages and documents.

import os
from typing import Any, Optional

from dotenv import load_dotenv

from convex import ConvexClient

# Load environment variables from a .env file (like database URLs)
load_dotenv()

DEPLOYMENT_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL")


def get_client(token: str) -> ConvexClient:
    client = ConvexClient(DEPLOYMENT_URL)
    client.set_auth(token)
    return client


# ============================================================================
# MESSAGE OPERATIONS
# ============================================================================

def get_history(conversation_id: str, token: str):
    """Fetch the chat history for a specific conversation from the database."""
    client = get_client(token)
    return client.query("messages:list", {"conversationId": conversation_id})


def save_msg(conversation_id: str, body: str, author: str, token: str):
    """Save a new message to the database for a specific conversation."""
    client = get_client(token)
    client.mutation(
        "messages:send",
        {"conversationId": conversation_id, "body": body, "author": author},
    )


# ============================================================================
# DOCUMENT / RAG OPERATIONS
# ============================================================================

def save_document(
    text: str,
    embedding: list[float],
    metadata: dict[str, Any],
    token: str,
) -> str:
    """
    Store a document chunk with its embedding in the vector database.
    
    Args:
        text: The document chunk text
        embedding: The 384-dimensional embedding vector
        metadata: Metadata including source, chunk_index, etc.
        token: Convex auth token
        
    Returns:
        The document ID
    """
    client = get_client(token)
    doc_id = client.mutation(
        "documents:store",
        {"text": text, "embedding": embedding, "metadata": metadata},
    )
    return doc_id


def vector_search(
    embedding: list[float],
    limit: int,
    token: str,
) -> list[dict[str, Any]]:
    """
    Perform vector similarity search to find relevant document chunks.
    
    Args:
        embedding: The query embedding vector
        limit: Maximum number of results
        token: Convex auth token
        
    Returns:
        List of matching documents with scores
    """
    client = get_client(token)
    results = client.action(
        "documents:vectorSearch",
        {"embedding": embedding, "limit": limit},
    )
    return results or []


def get_document_count(token: str) -> int:
    """Get the total number of documents in the shared knowledge base."""
    client = get_client(token)
    return client.query("documents:count", {})


def list_documents(token: str) -> list[dict[str, Any]]:
    """List all documents in the shared knowledge base."""
    client = get_client(token)
    return client.query("documents:list", {})


def delete_document(doc_id: str, token: str) -> None:
    """Delete a document by ID."""
    client = get_client(token)
    client.mutation("documents:remove", {"id": doc_id})


def delete_documents_by_source(source: str, token: str) -> int:
    """Delete all chunks for a source name. Returns number of deleted chunks."""
    client = get_client(token)
    result = client.mutation("documents:removeBySource", {"source": source})
    if isinstance(result, dict):
        return int(result.get("deleted", 0))
    return int(result or 0)
