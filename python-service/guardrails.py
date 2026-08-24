"""
Input and Output Guardrails for Production Safety

This module provides:
1. Input validation - length limits, basic injection detection
2. Output validation - confidence scoring, hallucination detection hints
3. Rate limiting configuration
"""

import re
from typing import Optional

from fastapi import HTTPException


# ============================================================================
# INPUT GUARDRAILS
# ============================================================================

# Maximum allowed input length (characters)
MAX_INPUT_LENGTH = 4000

# Patterns that might indicate prompt injection attempts
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"disregard\s+(all\s+)?previous",
    r"forget\s+(all\s+)?previous",
    r"you\s+are\s+now\s+(?:a\s+)?(?:different|new)",
    r"pretend\s+(?:you\s+are|to\s+be)",
    r"act\s+as\s+(?:if|though)",
    r"system\s*:\s*",  # Trying to inject system prompts
    r"<\|im_start\|>",  # ChatML injection
    r"\[\[system\]\]",  # Bracket system injection
]

# Compiled regex for efficiency
_injection_regex = re.compile(
    "|".join(INJECTION_PATTERNS),
    re.IGNORECASE | re.MULTILINE
)


class InputValidationError(Exception):
    """Raised when input fails validation."""
    pass


def validate_input(message: str) -> str:
    """
    Validate and sanitize user input.
    
    Args:
        message: The raw user message
        
    Returns:
        The validated message (stripped of leading/trailing whitespace)
        
    Raises:
        InputValidationError: If validation fails
    """
    # Strip whitespace
    message = message.strip()
    
    # Check for empty input
    if not message:
        raise InputValidationError("Message cannot be empty")
    
    # Check length
    if len(message) > MAX_INPUT_LENGTH:
        raise InputValidationError(
            f"Message exceeds maximum length of {MAX_INPUT_LENGTH} characters"
        )
    
    # Check for injection patterns
    if _injection_regex.search(message):
        # Log this for security monitoring but don't reveal detection to user
        print(f"SECURITY: Potential injection attempt detected")
        raise InputValidationError(
            "Message contains disallowed patterns"
        )
    
    return message


def validate_input_or_raise_http(message: str) -> str:
    """
    Validate input and raise HTTPException on failure.
    
    Use this in FastAPI endpoints for proper error responses.
    """
    try:
        return validate_input(message)
    except InputValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# OUTPUT GUARDRAILS
# ============================================================================

# Minimum similarity score to consider context "relevant"
RELEVANCE_THRESHOLD = 0.6

# Phrases that indicate the model is uncertain
UNCERTAINTY_PHRASES = [
    "i don't know",
    "i'm not sure",
    "i cannot find",
    "the context doesn't",
    "there is no information",
    "i don't have information",
    "based on the provided context, i cannot",
]


def calculate_response_confidence(
    retrieved_scores: list[float],
    response_text: str,
) -> dict:
    """
    Calculate confidence metrics for a RAG response.
    
    Args:
        retrieved_scores: Similarity scores from retrieval
        response_text: The generated response
        
    Returns:
        Dictionary with confidence metrics
    """
    # Retrieval confidence: average of top scores
    retrieval_confidence = 0.0
    if retrieved_scores:
        top_scores = sorted(retrieved_scores, reverse=True)[:3]
        retrieval_confidence = sum(top_scores) / len(top_scores)
    
    # Check if model expressed uncertainty
    response_lower = response_text.lower()
    expressed_uncertainty = any(
        phrase in response_lower for phrase in UNCERTAINTY_PHRASES
    )
    
    # Overall confidence
    if not retrieved_scores:
        # No RAG context - lower confidence for factual claims
        overall = 0.5
    elif retrieval_confidence < RELEVANCE_THRESHOLD:
        # Low relevance context
        overall = 0.4
    elif expressed_uncertainty:
        # Model is uncertain even with context
        overall = 0.3
    else:
        # Good retrieval + confident response
        overall = min(0.95, retrieval_confidence)
    
    return {
        "retrieval_confidence": round(retrieval_confidence, 3),
        "expressed_uncertainty": expressed_uncertainty,
        "overall_confidence": round(overall, 3),
        "has_rag_context": len(retrieved_scores) > 0,
        "top_retrieval_scores": [round(s, 3) for s in sorted(retrieved_scores, reverse=True)[:3]],
    }


def should_add_disclaimer(confidence_metrics: dict) -> Optional[str]:
    """
    Determine if a disclaimer should be added to the response.
    
    Args:
        confidence_metrics: Output from calculate_response_confidence
        
    Returns:
        Disclaimer text if needed, None otherwise
    """
    if confidence_metrics["overall_confidence"] < 0.4:
        return (
            "\n\n---\n"
            "*Note: This response may have limited accuracy as relevant context "
            "was not found in the knowledge base. Please verify important information.*"
        )
    
    if not confidence_metrics["has_rag_context"]:
        return (
            "\n\n---\n"
            "*This response is based on general knowledge, not your uploaded documents.*"
        )
    
    return None


# ============================================================================
# RATE LIMITING CONFIGURATION
# ============================================================================

# Rate limit configuration for slowapi
RATE_LIMIT_CHAT = "20/minute"  # Chat endpoint
RATE_LIMIT_INGEST = "10/minute"  # Document ingestion
RATE_LIMIT_SEARCH = "30/minute"  # Vector search
