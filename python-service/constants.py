"""
Centralized constants for the RAG chat service.

All configurable values and magic numbers live here so they can be
changed in one place without hunting through multiple files.
"""

# ============================================================================
# Service
# ============================================================================

SERVICE_NAME = "langchain-rag-api"
SERVICE_VERSION = "1.0.0"
API_HOST = "0.0.0.0"
API_PORT = 8000

# ============================================================================
# Chunking
# ============================================================================

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
CHUNK_SEPARATORS = ["\n\n", "\n", ". ", " ", ""]

# ============================================================================
# Embeddings
# ============================================================================

EMBEDDING_DIMENSIONS = 384  # Matches Convex vector index schema

# HuggingFace
HF_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# OpenAI (text-embedding-3-small supports custom dimensions)
OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"

# Google
GOOGLE_EMBEDDING_MODEL = "models/text-embedding-004"

# ============================================================================
# Retrieval
# ============================================================================

RETRIEVAL_TOP_K = 5
RETRIEVAL_THRESHOLD = 0.6  # Minimum cosine similarity to include in context

# ============================================================================
# LLM Provider Defaults
# ============================================================================

OPENAI_LLM_MODEL = "gpt-4o-mini"
ANTHROPIC_LLM_MODEL = "claude-sonnet-4-20250514"
GOOGLE_LLM_MODEL = "gemini-2.0-flash"
HUGGINGFACE_LLM_MODEL = "HuggingFaceH4/zephyr-7b-beta"

# ============================================================================
# Guardrails
# ============================================================================

MAX_INPUT_LENGTH = 4000
MAX_INGEST_TEXT_LENGTH = 100_000

# ============================================================================
# Logging
# ============================================================================

LOG_FORMAT = "json"
LOG_LEVEL = "INFO"
