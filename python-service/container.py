"""
Dependency Injection Container.

Dependency Inversion Principle: High-level modules should not depend on
low-level modules. Both should depend on abstractions.

This container wires up all dependencies and provides factory methods
for creating fully-configured service instances.
"""

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from interfaces import (
    IContextRetriever,
    IDocumentIngester,
    IEmbedder,
    ILLMProvider,
    ITextChunker,
    IVectorStore,
)
from providers import LLMProviderFactory
from services import (
    ContextRetriever,
    ConvexVectorStore,
    DocumentIngester,
    FallbackEmbedder,
    GoogleEmbedder,
    HuggingFaceEmbedder,
    OpenAIEmbedder,
    RecursiveTextChunker,
)
from constants import (
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    HF_EMBEDDING_MODEL,
    RETRIEVAL_TOP_K,
    RETRIEVAL_THRESHOLD,
)


@dataclass
class RAGConfig:
    """Configuration for RAG services."""

    chunk_size: int = CHUNK_SIZE
    chunk_overlap: int = CHUNK_OVERLAP
    embedding_model: str = HF_EMBEDDING_MODEL
    retrieval_top_k: int = RETRIEVAL_TOP_K
    retrieval_threshold: float = RETRIEVAL_THRESHOLD


class ServiceContainer:
    """
    Dependency Injection container for RAG services.
    
    Centralizes dependency creation and wiring.
    Supports both singleton and per-request scoped services.
    """
    
    def __init__(self, config: RAGConfig | None = None):
        self._config = config or RAGConfig()
        self._singletons: dict[str, Any] = {}
    
    @property
    def config(self) -> RAGConfig:
        """Get the RAG configuration."""
        return self._config
    
    # --- Singleton Services (shared across requests) ---
    
    @lru_cache(maxsize=1)
    def get_chunker(self) -> ITextChunker:
        """Get the text chunker (singleton)."""
        return RecursiveTextChunker(
            chunk_size=self._config.chunk_size,
            chunk_overlap=self._config.chunk_overlap,
        )
    
    @lru_cache(maxsize=1)
    def get_embedder(self) -> IEmbedder:
        """
        Get the embedder with automatic fallback across providers.
        
        Builds a fallback chain based on which API keys are available.
        The provider specified by RAG_EMBEDDING_PROVIDER is tried first,
        then remaining providers in order: huggingface, openai, google.
        
        If one provider's credits are depleted, the next is tried automatically.
        All providers use 384 dimensions to match the Convex vector index schema.
        """
        preferred = os.getenv("RAG_EMBEDDING_PROVIDER", "huggingface").lower()
        
        # Build provider list: preferred first, then the rest
        all_providers = ["huggingface", "openai", "google"]
        ordered = [preferred] + [p for p in all_providers if p != preferred]
        
        embedders: list[IEmbedder] = []
        for provider in ordered:
            try:
                if provider == "huggingface":
                    embedders.append(HuggingFaceEmbedder())
                elif provider == "openai":
                    embedders.append(OpenAIEmbedder())
                elif provider == "google":
                    embedders.append(GoogleEmbedder())
            except (ValueError, Exception) as e:
                # Skip providers without API keys configured
                print(f"INFO: Skipping {provider} embedder (not configured): {e}")
        
        if not embedders:
            raise ValueError(
                "No embedding provider configured. Set at least one of: "
                "HUGGINGFACE_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY"
            )
        
        if len(embedders) == 1:
            return embedders[0]
        
        print(f"INFO: Embedding fallback chain: {' → '.join(type(e).__name__ for e in embedders)}")
        return FallbackEmbedder(embedders)
    
    @lru_cache(maxsize=1)
    def get_llm_provider(self) -> ILLMProvider:
        """Get the LLM provider (singleton)."""
        return LLMProviderFactory.create_from_env()
    
    # --- Scoped Services (per-request, need auth token) ---
    
    def get_vector_store(self, token: str) -> IVectorStore:
        """Get a vector store instance (requires auth token)."""
        return ConvexVectorStore(token=token)
    
    def get_document_ingester(self, token: str) -> IDocumentIngester:
        """
        Get a document ingester instance.
        
        Wires together chunker, embedder, and vector store.
        """
        return DocumentIngester(
            chunker=self.get_chunker(),
            embedder=self.get_embedder(),
            vector_store=self.get_vector_store(token),
        )
    
    def get_context_retriever(self, token: str) -> IContextRetriever:
        """
        Get a context retriever instance.
        
        Wires together embedder and vector store.
        """
        return ContextRetriever(
            embedder=self.get_embedder(),
            vector_store=self.get_vector_store(token),
        )


# Global container instance with default config
_container: ServiceContainer | None = None


def get_container() -> ServiceContainer:
    """Get the global service container (lazy initialization)."""
    global _container
    if _container is None:
        # Load config from environment
        config = RAGConfig(
            chunk_size=int(os.getenv("RAG_CHUNK_SIZE", str(CHUNK_SIZE))),
            chunk_overlap=int(os.getenv("RAG_CHUNK_OVERLAP", str(CHUNK_OVERLAP))),
            embedding_model=os.getenv(
                "RAG_EMBEDDING_MODEL",
                HF_EMBEDDING_MODEL,
            ),
            retrieval_top_k=int(os.getenv("RAG_TOP_K", str(RETRIEVAL_TOP_K))),
            retrieval_threshold=float(os.getenv("RAG_THRESHOLD", str(RETRIEVAL_THRESHOLD))),
        )
        _container = ServiceContainer(config)
    return _container


def reset_container() -> None:
    """Reset the global container (useful for testing)."""
    global _container
    _container = None
