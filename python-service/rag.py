# RAG (Retrieval-Augmented Generation) pipeline module.
#
# DEPRECATED: This module is kept for backward compatibility only.
# The SOLID-compliant implementation lives in:
#   - interfaces.py  (Protocol contracts)
#   - services.py    (Concrete implementations)
#   - providers.py   (LLM provider factory)
#   - container.py   (Dependency injection)
#
# New code should use ServiceContainer via `from container import get_container`.

import os
import warnings
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

import db as convex

load_dotenv()

# Emit deprecation warning on import
warnings.warn(
    "rag.py is deprecated. Use services.py + container.py for SOLID-compliant "
    "RAG functionality via ServiceContainer.",
    DeprecationWarning,
    stacklevel=2,
)

# Embedding model configuration - matches Convex schema (384 dimensions)
# Uses HuggingFace Inference API (works with Python 3.13, no local torch needed)
EMBEDDING_MODEL = os.getenv(
    "HUGGINGFACE_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
)
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Chunking configuration for optimal retrieval
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

# Retrieval configuration
TOP_K_RESULTS = 5
SIMILARITY_THRESHOLD = 0.7  # Minimum similarity score to include in context


class RAGPipeline:
    """
    RAG pipeline for document ingestion and retrieval.
    
    Responsibilities:
    - Chunk documents into semantically meaningful pieces
    - Generate embeddings for chunks
    - Store in Convex vector database
    - Retrieve relevant context for queries
    """

    def __init__(self):
        self._embeddings: Optional[HuggingFaceEndpointEmbeddings] = None
        self._text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    @property
    def embeddings(self) -> HuggingFaceEndpointEmbeddings:
        """Lazy-load the embedding model via HuggingFace Inference API."""
        if self._embeddings is None:
            self._embeddings = HuggingFaceEndpointEmbeddings(
                model=EMBEDDING_MODEL,
                huggingfacehub_api_token=HUGGINGFACE_API_KEY,
            )
        return self._embeddings

    def chunk_text(self, text: str) -> list[str]:
        """
        Split text into chunks optimized for retrieval.
        
        Uses recursive character splitting with semantic separators
        (paragraphs > sentences > words) to maintain context.
        """
        return self._text_splitter.split_text(text)

    def generate_embedding(self, text: str) -> list[float]:
        """Generate a 384-dimensional embedding vector for text."""
        return self.embeddings.embed_query(text)

    def generate_embeddings_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts efficiently."""
        return self.embeddings.embed_documents(texts)

    async def ingest_text(
        self,
        text: str,
        source: str,
        convex_token: str,
        metadata: Optional[dict] = None,
    ) -> list[str]:
        """
        Ingest a text document into the vector store.
        
        Args:
            text: The document text to ingest
            source: Source identifier (filename, URL, etc.)
            metadata: Optional metadata to store with chunks
            convex_token: Auth token for Convex
            
        Returns:
            List of document IDs for the created chunks
        """
        chunks = self.chunk_text(text)
        if not chunks:
            return []

        embeddings = self.generate_embeddings_batch(chunks)
        
        doc_ids = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_metadata = {
                "source": source,
                "chunk_index": i,
                "total_chunks": len(chunks),
                **(metadata or {}),
            }
            
            doc_id = convex.save_document(
                text=chunk,
                embedding=embedding,
                metadata=chunk_metadata,
                token=convex_token,
            )
            doc_ids.append(doc_id)
        
        return doc_ids

    async def ingest_url(
        self,
        url: str,
        convex_token: str,
        metadata: Optional[dict] = None,
    ) -> list[str]:
        """
        Fetch and ingest content from a URL.
        
        Args:
            url: The URL to fetch and ingest
            convex_token: Auth token for Convex
            metadata: Optional additional metadata
            
        Returns:
            List of document IDs for the created chunks
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
        
        # Extract text from HTML
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove script and style elements
        for element in soup(["script", "style", "nav", "footer", "header"]):
            element.decompose()
        
        # Get text content
        text = soup.get_text(separator="\n", strip=True)
        
        # Clean up whitespace
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        text = "\n".join(lines)
        
        url_metadata = {
            "url": url,
            "content_type": response.headers.get("content-type", "unknown"),
            **(metadata or {}),
        }
        
        return await self.ingest_text(
            text=text,
            source=url,
            convex_token=convex_token,
            metadata=url_metadata,
        )

    def retrieve(
        self,
        query: str,
        convex_token: str,
        top_k: int = TOP_K_RESULTS,
        threshold: float = SIMILARITY_THRESHOLD,
    ) -> list[dict]:
        """
        Retrieve relevant document chunks for a query.
        
        Args:
            query: The search query
            convex_token: Auth token for Convex
            top_k: Maximum number of results to return
            threshold: Minimum similarity score (0-1)
            
        Returns:
            List of relevant chunks with metadata and scores
        """
        query_embedding = self.generate_embedding(query)
        
        results = convex.vector_search(
            embedding=query_embedding,
            limit=top_k,
            token=convex_token,
        )
        
        # Filter by threshold and format results
        relevant = []
        for result in results:
            score = result.get("_score", 0)
            if score >= threshold:
                relevant.append({
                    "text": result.get("text", ""),
                    "metadata": result.get("metadata", {}),
                    "score": score,
                })
        
        return relevant

    def build_context_prompt(self, retrieved_docs: list[dict]) -> str:
        """
        Build a context string from retrieved documents for the LLM.
        
        Args:
            retrieved_docs: List of retrieved document chunks
            
        Returns:
            Formatted context string for injection into the prompt
        """
        if not retrieved_docs:
            return ""
        
        context_parts = []
        for i, doc in enumerate(retrieved_docs, 1):
            source = doc.get("metadata", {}).get("source", "Unknown")
            text = doc["text"]
            context_parts.append(f"[Source {i}: {source}]\n{text}")
        
        return "\n\n".join(context_parts)


# Singleton instance for reuse
_rag_pipeline: Optional[RAGPipeline] = None


def get_rag_pipeline() -> RAGPipeline:
    """Get or create the singleton RAG pipeline instance."""
    global _rag_pipeline
    if _rag_pipeline is None:
        _rag_pipeline = RAGPipeline()
    return _rag_pipeline
