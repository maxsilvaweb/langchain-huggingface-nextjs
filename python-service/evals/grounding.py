"""
Response grounding evals via langsmith.evaluate.

Uploads EVAL_CASES as a LangSmith dataset, runs the RAG chat chain on each
example, and scores expected / forbidden string presence.

Usage:
    cd python-service
    python -m evals.grounding
"""

from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from langsmith import Client, evaluate

from llm import get_chain

load_dotenv()

DATASET_NAME = "rag-response-grounding"

EVAL_CASES: list[dict[str, Any]] = [
    {
        "name": "direct_answer_from_context",
        "context": "The company was founded in 2020 by Jane Doe. It has 50 employees.",
        "query": "When was the company founded?",
        "expected_in_response": ["2020"],
        "forbidden_in_response": [],
    },
    {
        "name": "should_cite_source",
        "context": "[Source 1: company_info.txt]\nThe product costs $99 per month.",
        "query": "What is the product price?",
        "expected_in_response": ["99", "$"],
        "forbidden_in_response": [],
    },
    {
        "name": "irrelevant_context",
        "context": "The weather in Paris is usually mild in spring.",
        "query": "What is the capital of Australia?",
        "expected_in_response": [],
        "forbidden_in_response": ["Paris", "weather"],
    },
    {
        "name": "no_hallucination",
        "context": "The CEO is John Smith.",
        "query": "Who is the CTO?",
        "expected_in_response": [],
        "forbidden_in_response": [],
    },
]


def _examples_payload() -> list[dict[str, Any]]:
    return [
        {
            "inputs": {"query": case["query"], "context": case["context"]},
            "outputs": {
                "expected_in_response": case["expected_in_response"],
                "forbidden_in_response": case["forbidden_in_response"],
            },
            "metadata": {"name": case["name"]},
        }
        for case in EVAL_CASES
    ]


def ensure_dataset(*, force: bool = False) -> str:
    """Create the LangSmith dataset from EVAL_CASES if it does not exist."""
    client = Client()
    if force and client.has_dataset(dataset_name=DATASET_NAME):
        client.delete_dataset(dataset_name=DATASET_NAME)

    if not client.has_dataset(dataset_name=DATASET_NAME):
        dataset = client.create_dataset(
            DATASET_NAME,
            description="RAG response grounding: expected/forbidden string checks",
        )
        client.create_examples(dataset_id=dataset.id, examples=_examples_payload())

    return DATASET_NAME


def predict(inputs: dict) -> dict:
    """Target system: RAG-prompted chat chain with empty history."""
    provider = os.getenv("EVAL_PROVIDER", "openai")
    model_name = os.getenv("EVAL_MODEL", "gpt-4o-mini")
    chain = get_chain(
        model_name=model_name,
        provider=provider,
        rag_context=inputs["context"],
    )
    response = chain.invoke({"input": inputs["query"], "history": []})
    return {"response": response}


def contains_expected(
    inputs: dict,
    outputs: dict,
    reference_outputs: dict,
) -> dict:
    """Pass if every expected substring appears in the response."""
    response = (outputs.get("response") or "").lower()
    expected = reference_outputs.get("expected_in_response") or []
    missing = [item for item in expected if item.lower() not in response]
    return {
        "key": "contains_expected",
        "score": 1.0 if not missing else 0.0,
        "comment": "ok" if not missing else f"missing: {missing}",
    }


def avoids_forbidden(
    inputs: dict,
    outputs: dict,
    reference_outputs: dict,
) -> dict:
    """Pass if no forbidden substring appears in the response."""
    response = (outputs.get("response") or "").lower()
    forbidden = reference_outputs.get("forbidden_in_response") or []
    found = [item for item in forbidden if item.lower() in response]
    return {
        "key": "avoids_forbidden",
        "score": 1.0 if not found else 0.0,
        "comment": "ok" if not found else f"found: {found}",
    }


def run_grounding_eval(*, force_dataset: bool = False):
    """Ensure dataset exists, then run langsmith.evaluate and upload results."""
    if not os.getenv("LANGSMITH_API_KEY"):
        raise RuntimeError(
            "LANGSMITH_API_KEY is required to run grounding evals against LangSmith"
        )

    dataset_name = ensure_dataset(force=force_dataset)
    return evaluate(
        predict,
        data=dataset_name,
        evaluators=[contains_expected, avoids_forbidden],
        experiment_prefix="grounding",
        metadata={
            "provider": os.getenv("EVAL_PROVIDER", "openai"),
            "model": os.getenv("EVAL_MODEL", "gpt-4o-mini"),
        },
        max_concurrency=2,
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run response grounding evals in LangSmith")
    parser.add_argument(
        "--force-dataset",
        action="store_true",
        help="Delete and recreate the LangSmith dataset from EVAL_CASES",
    )
    args = parser.parse_args()
    results = run_grounding_eval(force_dataset=args.force_dataset)
    print(results)
