"""
RAG Retrieval Evaluation Tests

These tests verify that the RAG pipeline correctly:
1. Chunks documents appropriately
2. Generates embeddings of the correct dimensions
3. Retrieves relevant chunks for queries
4. Handles edge cases gracefully

Uses the SOLID-compliant service classes from services.py.
"""

import pytest
from services import (
    ContextRetriever,
    RecursiveTextChunker,
)
from container import RAGConfig


class TestDocumentChunking:
    """Test the document chunking logic (ITextChunker)."""

    @pytest.fixture
    def config(self):
        return RAGConfig()

    @pytest.fixture
    def chunker(self, config):
        return RecursiveTextChunker(
            chunk_size=config.chunk_size,
            chunk_overlap=config.chunk_overlap,
        )

    def test_chunk_short_text(self, chunker):
        """Short text should remain as a single chunk."""
        text = "This is a short piece of text."
        chunks = chunker.chunk(text)
        
        assert len(chunks) == 1
        assert chunks[0] == text

    def test_chunk_long_text(self, chunker, config):
        """Long text should be split into multiple chunks."""
        # Create text longer than chunk_size
        text = "This is a sentence. " * 100  # ~2000 chars
        chunks = chunker.chunk(text)
        
        assert len(chunks) > 1
        # Each chunk should be <= chunk_size (with some flexibility for word boundaries)
        for chunk in chunks:
            assert len(chunk) <= config.chunk_size + 50  # Allow small overflow

    def test_chunk_preserves_content(self, chunker):
        """Chunking should not lose any content."""
        text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
        chunks = chunker.chunk(text)
        
        # Join chunks and verify all original content is present
        rejoined = " ".join(chunks)
        for word in text.split():
            assert word in rejoined

    def test_chunk_empty_text(self, chunker):
        """Empty text should return empty list."""
        chunks = chunker.chunk("")
        assert chunks == []

    def test_chunk_respects_separators(self, chunker):
        """Chunking should prefer splitting at paragraph/sentence boundaries."""
        text = "First paragraph with some content here.\n\nSecond paragraph with different content."
        chunks = chunker.chunk(text)
        
        # With short text, it might be one chunk, but if split,
        # it should be at the paragraph boundary
        if len(chunks) > 1:
            assert "First paragraph" in chunks[0]
            assert "Second paragraph" in chunks[-1]


class TestEmbeddingGeneration:
    """Test the embedding generation logic (IEmbedder)."""

    @pytest.fixture
    def embedder(self):
        from services import HuggingFaceEmbedder
        return HuggingFaceEmbedder()

    def test_embedding_dimensions(self, embedder):
        """Embeddings should be 384-dimensional (MiniLM-L6-v2)."""
        embedding = embedder.embed("Test text")
        
        assert isinstance(embedding, list)
        assert len(embedding) == 384

    def test_embedding_values_normalized(self, embedder):
        """Embeddings should be normalized (values between -1 and 1)."""
        embedding = embedder.embed("Test text")
        
        for value in embedding:
            assert -1.5 <= value <= 1.5  # Allow small tolerance

    def test_embedding_batch_consistency(self, embedder):
        """Batch embedding should produce same results as individual."""
        texts = ["First text", "Second text"]
        
        batch_embeddings = embedder.embed_batch(texts)
        individual_embeddings = [embedder.embed(t) for t in texts]
        
        assert len(batch_embeddings) == len(individual_embeddings)
        for batch, individual in zip(batch_embeddings, individual_embeddings):
            # Allow small floating point differences
            for b, i in zip(batch, individual):
                assert abs(b - i) < 0.001

    def test_similar_texts_similar_embeddings(self, embedder):
        """Semantically similar texts should have similar embeddings."""
        text1 = "The cat sat on the mat."
        text2 = "A cat was sitting on a rug."
        text3 = "Quantum physics explains wave functions."
        
        emb1 = embedder.embed(text1)
        emb2 = embedder.embed(text2)
        emb3 = embedder.embed(text3)
        
        # Calculate cosine similarity
        def cosine_sim(a, b):
            dot = sum(x * y for x, y in zip(a, b))
            norm_a = sum(x ** 2 for x in a) ** 0.5
            norm_b = sum(x ** 2 for x in b) ** 0.5
            return dot / (norm_a * norm_b)
        
        sim_1_2 = cosine_sim(emb1, emb2)
        sim_1_3 = cosine_sim(emb1, emb3)
        
        # Similar texts should have higher similarity
        assert sim_1_2 > sim_1_3


class TestContextBuilding:
    """Test the context prompt building logic (IContextRetriever.build_context)."""

    @pytest.fixture
    def retriever(self):
        """Create a ContextRetriever with mock dependencies."""
        from interfaces import IEmbedder, IVectorStore
        
        class MockEmbedder:
            def embed(self, text): return [0.0] * 384
            def embed_batch(self, texts): return [[0.0] * 384] * len(texts)
        
        class MockVectorStore:
            def store(self, text, embedding, metadata): return "mock-id"
            def search(self, embedding, limit): return []
        
        return ContextRetriever(
            embedder=MockEmbedder(),
            vector_store=MockVectorStore(),
        )

    def test_build_context_empty(self, retriever):
        """Empty docs should return empty context."""
        context = retriever.build_context([])
        assert context == ""

    def test_build_context_single_doc(self, retriever):
        """Single doc should format correctly."""
        docs = [
            {"text": "Document content here.", "metadata": {"source": "test.txt"}, "_score": 0.9}
        ]
        context = retriever.build_context(docs)
        
        assert "Source 1" in context
        assert "test.txt" in context
        assert "Document content here." in context

    def test_build_context_multiple_docs(self, retriever):
        """Multiple docs should be numbered and separated."""
        docs = [
            {"text": "First doc.", "metadata": {"source": "first.txt"}, "_score": 0.9},
            {"text": "Second doc.", "metadata": {"source": "second.txt"}, "_score": 0.8},
        ]
        context = retriever.build_context(docs)
        
        assert "Source 1" in context
        assert "Source 2" in context
        assert "First doc." in context
        assert "Second doc." in context

    def test_build_context_missing_source(self, retriever):
        """Missing source should default to 'Unknown'."""
        docs = [
            {"text": "No source doc.", "metadata": {}, "_score": 0.7}
        ]
        context = retriever.build_context(docs)
        
        assert "Unknown" in context
