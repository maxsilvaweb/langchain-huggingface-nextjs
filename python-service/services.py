"""
RAG Service implementations following SOLID principles.

Single Responsibility: Each class has one job.
Dependency Inversion: High-level modules depend on abstractions.
"""

import os
from typing import Any

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_openai import OpenAIEmbeddings

from constants import (
    CHUNK_OVERLAP,
    CHUNK_SEPARATORS,
    CHUNK_SIZE,
    EMBEDDING_DIMENSIONS,
    GOOGLE_EMBEDDING_MODEL,
    HF_EMBEDDING_MODEL,
    OPENAI_EMBEDDING_MODEL,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter

from interfaces import (
    IContextRetriever,
    IDocumentIngester,
    IEmbedder,
    ITextChunker,
    IVectorStore,
)


class RecursiveTextChunker(ITextChunker):
    """
    Text chunker using recursive character splitting.
    
    Single Responsibility: Split text into chunks optimized for retrieval.
    """
    
    def __init__(
        self,
        chunk_size: int = CHUNK_SIZE,
        chunk_overlap: int = CHUNK_OVERLAP,
        separators: list[str] | None = None,
    ):
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=separators or CHUNK_SEPARATORS,
            length_function=len,
        )
    
    def chunk(self, text: str) -> list[str]:
        """Split text into chunks."""
        if not text or not text.strip():
            return []
        return self._splitter.split_text(text)


class HuggingFaceEmbedder(IEmbedder):
    """
    Embedder using HuggingFace Inference API.
    
    Single Responsibility: Generate vector embeddings from text.
    """
    
    DEFAULT_MODEL = HF_EMBEDDING_MODEL
    
    def __init__(
        self,
        model_name: str | None = None,
        api_key: str | None = None,
    ):
        self._api_key = api_key or os.getenv("HUGGINGFACE_API_KEY")
        if not self._api_key:
            raise ValueError("HuggingFace API key required for embeddings")
        
        self._model = HuggingFaceEndpointEmbeddings(
            model=model_name or self.DEFAULT_MODEL,
            huggingfacehub_api_token=self._api_key,
        )
    
    def embed(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        return self._model.embed_query(text)
    
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts."""
        return self._model.embed_documents(texts)


class OpenAIEmbedder(IEmbedder):
    """
    Embedder using OpenAI's text-embedding-3-small model.
    
    Uses dimensions=384 to match the Convex vector index schema
    (same as sentence-transformers/all-MiniLM-L6-v2), so no schema
    change is needed when switching from HuggingFace to OpenAI.
    
    Single Responsibility: Generate vector embeddings from text.
    """
    
    DEFAULT_MODEL = OPENAI_EMBEDDING_MODEL
    DEFAULT_DIMENSIONS = EMBEDDING_DIMENSIONS  # Match Convex schema
    
    def __init__(
        self,
        model_name: str | None = None,
        api_key: str | None = None,
        dimensions: int | None = None,
    ):
        self._api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self._api_key:
            raise ValueError("OpenAI API key required for embeddings")
        
        self._model = OpenAIEmbeddings(
            model=model_name or self.DEFAULT_MODEL,
            api_key=self._api_key,
            dimensions=dimensions or self.DEFAULT_DIMENSIONS,
        )
    
    def embed(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        return self._model.embed_query(text)
    
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts."""
        return self._model.embed_documents(texts)


class GoogleEmbedder(IEmbedder):
    """
    Embedder using Google's text-embedding-004 model.
    
    Uses output_dimensionality=384 to match the Convex vector index schema.
    
    Single Responsibility: Generate vector embeddings from text.
    """
    
    DEFAULT_MODEL = GOOGLE_EMBEDDING_MODEL
    DEFAULT_DIMENSIONS = EMBEDDING_DIMENSIONS  # Match Convex schema
    
    def __init__(
        self,
        model_name: str | None = None,
        api_key: str | None = None,
        dimensions: int | None = None,
    ):
        self._api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self._api_key:
            raise ValueError("Google API key required for embeddings")
        
        self._model = GoogleGenerativeAIEmbeddings(
            model=model_name or self.DEFAULT_MODEL,
            google_api_key=self._api_key,
            output_dimensionality=dimensions or self.DEFAULT_DIMENSIONS,
        )
    
    def embed(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        return self._model.embed_query(text)
    
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts."""
        return self._model.embed_documents(texts)


class FallbackEmbedder(IEmbedder):
    """
    Embedder with automatic fallback across multiple providers.
    
    Tries each embedder in order. If one fails (depleted credits, API
    errors, rate limits), it falls back to the next. Caches the first
    working provider so subsequent calls skip failed ones.
    
    Single Responsibility: Generate embeddings with resilience.
    Dependency Inversion: Depends on IEmbedder abstractions.
    """
    
    def __init__(self, embedders: list[IEmbedder]):
        if not embedders:
            raise ValueError("At least one embedder required for fallback")
        self._embedders = embedders
        self._working_index: int | None = None
    
    def _try_embedders(self, operation_name: str, *args):
        """Try each embedder until one succeeds."""
        # If we found a working embedder before, try it first
        indices = list(range(len(self._embedders)))
        if self._working_index is not None:
            indices.sort(key=lambda i: 0 if i == self._working_index else 1)
        
        last_error = None
        for idx in indices:
            embedder = self._embedders[idx]
            try:
                result = getattr(embedder, operation_name)(*args)
                self._working_index = idx
                return result
            except Exception as e:
                provider = type(embedder).__name__
                print(f"WARNING: {provider} embeddings failed ({operation_name}): {e}")
                last_error = e
        
        raise RuntimeError(
            f"All embedding providers failed. Last error: {last_error}"
        )
    
    def embed(self, text: str) -> list[float]:
        """Generate embedding, falling back across providers."""
        return self._try_embedders("embed", text)
    
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate batch embeddings, falling back across providers."""
        return self._try_embedders("embed_batch", texts)


class ConvexVectorStore(IVectorStore):
    """
    Vector store using Convex backend.
    
    Single Responsibility: Store and retrieve vectors from Convex.
    Dependency Inversion: Depends on Convex client abstraction.
    """
    
    def __init__(self, token: str, convex_url: str | None = None):
        # Import here to avoid circular dependency
        from convex import ConvexClient
        
        self._url = convex_url or os.getenv("NEXT_PUBLIC_CONVEX_URL") or os.getenv("CONVEX_URL")
        if not self._url:
            raise ValueError("NEXT_PUBLIC_CONVEX_URL not configured")
        
        self._client = ConvexClient(self._url)
        self._client.set_auth(token)
    
    def store(
        self,
        text: str,
        embedding: list[float],
        metadata: dict[str, Any],
    ) -> str:
        """Store a document chunk with its embedding."""
        result = self._client.mutation(
            "documents:store",
            {
                "text": text,
                "embedding": embedding,
                "metadata": metadata,
            },
        )
        return str(result)
    
    def search(
        self,
        embedding: list[float],
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """Search for similar documents by embedding vector."""
        return self._client.action(
            "documents:vectorSearch",
            {
                "embedding": embedding,
                "limit": limit,
            },
        )


class DocumentIngester(IDocumentIngester):
    """
    Document ingestion orchestrator.
    
    Single Responsibility: Coordinate chunking, embedding, and storage.
    Dependency Inversion: Depends on abstractions, not concrete implementations.
    """
    
    def __init__(
        self,
        chunker: ITextChunker,
        embedder: IEmbedder,
        vector_store: IVectorStore,
    ):
        self._chunker = chunker
        self._embedder = embedder
        self._vector_store = vector_store
    
    async def ingest(
        self,
        text: str,
        source: str,
        metadata: dict[str, Any] | None = None,
    ) -> list[str]:
        """
        Ingest a document: chunk, embed, and store.
        
        Returns list of created document IDs.
        """
        # Chunk the text
        chunks = self._chunker.chunk(text)
        if not chunks:
            return []
        
        # Generate embeddings for all chunks
        embeddings = self._embedder.embed_batch(chunks)
        
        # Store each chunk with metadata
        doc_ids: list[str] = []
        base_metadata = metadata or {}
        
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_metadata = {
                **base_metadata,
                "source": source,
                "chunk_index": i,
                "total_chunks": len(chunks),
            }
            doc_id = self._vector_store.store(chunk, embedding, chunk_metadata)
            doc_ids.append(doc_id)
        
        return doc_ids


class ContextRetriever(IContextRetriever):
    """
    RAG context retriever.
    
    Single Responsibility: Retrieve and format context for LLM queries.
    Dependency Inversion: Depends on embedder and vector store abstractions.
    """
    
    def __init__(
        self,
        embedder: IEmbedder,
        vector_store: IVectorStore,
    ):
        self._embedder = embedder
        self._vector_store = vector_store
    
    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        threshold: float = 0.6,
    ) -> list[dict[str, Any]]:
        """Retrieve relevant documents for a query."""
        # Generate query embedding
        query_embedding = self._embedder.embed(query)
        
        # Search vector store
        results = self._vector_store.search(query_embedding, limit=top_k)
        
        # Filter by similarity threshold
        filtered = [
            doc for doc in results
            if doc.get("_score", 0) >= threshold
        ]
        
        return filtered
    
    def build_context(self, documents: list[dict[str, Any]]) -> str:
        """Build a context string from retrieved documents."""
        if not documents:
            return ""
        
        context_parts: list[str] = []
        
        for i, doc in enumerate(documents, 1):
            source = doc.get("metadata", {}).get("source", "Unknown")
            text = doc.get("text", "")
            score = doc.get("_score", 0)
            
            context_parts.append(
                f"[Source {i}: {source} (relevance: {score:.2f})]\n{text}"
            )
        
        return "\n\n---\n\n".join(context_parts)
