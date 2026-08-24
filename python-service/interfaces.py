"""
Abstract interfaces (Protocols) for the RAG system.

Following Interface Segregation Principle (ISP) - clients should not be forced
to depend on interfaces they don't use. Each protocol defines a focused contract.

Using Python's Protocol for structural subtyping (duck typing with type hints).
"""

from abc import abstractmethod
from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ITextChunker(Protocol):
    """
    Interface for text chunking strategies.
    
    Single Responsibility: Split text into retrievable chunks.
    """
    
    @abstractmethod
    def chunk(self, text: str) -> list[str]:
        """Split text into chunks optimized for retrieval."""
        ...


@runtime_checkable
class IEmbedder(Protocol):
    """
    Interface for embedding generation.
    
    Single Responsibility: Convert text to vector embeddings.
    """
    
    @abstractmethod
    def embed(self, text: str) -> list[float]:
        """Generate embedding vector for a single text."""
        ...
    
    @abstractmethod
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts efficiently."""
        ...


@runtime_checkable
class IVectorStore(Protocol):
    """
    Interface for vector storage and retrieval.
    
    Single Responsibility: Store and query vector embeddings.
    """
    
    @abstractmethod
    def store(
        self,
        text: str,
        embedding: list[float],
        metadata: dict[str, Any],
    ) -> str:
        """Store a document chunk with its embedding. Returns document ID."""
        ...
    
    @abstractmethod
    def search(
        self,
        embedding: list[float],
        limit: int,
    ) -> list[dict[str, Any]]:
        """Search for similar documents by embedding vector."""
        ...


@runtime_checkable
class ILLMProvider(Protocol):
    """
    Interface for LLM providers.
    
    Single Responsibility: Provide configured LLM instances.
    Open/Closed: New providers can be added without modifying existing code.
    """
    
    @abstractmethod
    def get_model(self, model_name: str | None = None) -> Any:
        """Get a configured LLM model instance."""
        ...
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the provider identifier."""
        ...


@runtime_checkable
class IDocumentIngester(Protocol):
    """
    Interface for document ingestion pipeline.
    
    Single Responsibility: Orchestrate the ingestion of documents.
    """
    
    @abstractmethod
    async def ingest(
        self,
        text: str,
        source: str,
        metadata: dict[str, Any] | None = None,
    ) -> list[str]:
        """Ingest a document and return created chunk IDs."""
        ...


@runtime_checkable
class IContextRetriever(Protocol):
    """
    Interface for RAG context retrieval.
    
    Single Responsibility: Retrieve relevant context for queries.
    """
    
    @abstractmethod
    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        threshold: float = 0.6,
    ) -> list[dict[str, Any]]:
        """Retrieve relevant document chunks for a query."""
        ...
    
    @abstractmethod
    def build_context(self, documents: list[dict[str, Any]]) -> str:
        """Build a context string from retrieved documents."""
        ...
