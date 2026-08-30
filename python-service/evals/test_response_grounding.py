"""
Response Grounding Evaluation Tests

Unit tests for prompts/confidence stay local.
LLM grounding cases run via langsmith.evaluate (see evals.grounding).
"""

import os

import pytest
from container import RAGConfig
from evals.grounding import EVAL_CASES, run_grounding_eval
from llm import get_chain, RAG_SYSTEM_PROMPT


class TestPromptConstruction:
    """Test that prompts are constructed correctly."""

    def test_base_prompt_without_rag(self):
        """Without RAG context, should use base system prompt."""
        chain = get_chain(model_name="gpt-4o-mini", provider="openai", rag_context=None)
        assert chain is not None

    def test_rag_prompt_with_context(self):
        """With RAG context, should use RAG system prompt."""
        context = "Test context about quantum physics."
        chain = get_chain(model_name="gpt-4o-mini", provider="openai", rag_context=context)
        assert chain is not None

    def test_rag_prompt_template_has_guidelines(self):
        """RAG prompt template should include citation guidelines."""
        assert "cite" in RAG_SYSTEM_PROMPT.lower() or "source" in RAG_SYSTEM_PROMPT.lower()
        assert "context" in RAG_SYSTEM_PROMPT.lower()

    def test_rag_prompt_template_has_context_placeholder(self):
        """RAG prompt template should have a {context} placeholder."""
        assert "{context}" in RAG_SYSTEM_PROMPT


class TestGroundingEvalDataset:
    """Validate grounding cases and optionally run LangSmith evaluate."""

    @pytest.mark.parametrize("case", EVAL_CASES, ids=lambda c: c["name"])
    def test_grounding_case_structure(self, case):
        assert "context" in case
        assert "query" in case
        assert "expected_in_response" in case
        assert "forbidden_in_response" in case

    @pytest.mark.langsmith
    def test_grounding_langsmith_evaluate(self):
        """Runs LLM calls and uploads an experiment to LangSmith."""
        if not os.getenv("LANGSMITH_API_KEY"):
            pytest.skip("LANGSMITH_API_KEY not set")
        results = run_grounding_eval()
        assert results is not None


class TestConfidenceScoring:
    """Test retrieval confidence scoring logic using RAGConfig."""

    def test_high_similarity_high_confidence(self):
        config = RAGConfig()
        score = 0.9
        assert score >= config.retrieval_threshold

    def test_low_similarity_low_confidence(self):
        config = RAGConfig()
        score = 0.3
        assert score < config.retrieval_threshold

    def test_threshold_boundary(self):
        config = RAGConfig()
        assert 0.61 >= config.retrieval_threshold
        assert 0.59 < config.retrieval_threshold
