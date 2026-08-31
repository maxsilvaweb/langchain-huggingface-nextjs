"""
Rate limiting for the FastAPI service (slowapi).

Keys by hashed Bearer token so each authenticated user gets their own bucket
even when all traffic comes from the Next.js proxy (shared IP).
"""

from __future__ import annotations

import hashlib
import os
import sys

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from guardrails import RATE_LIMIT_CHAT, RATE_LIMIT_INGEST, RATE_LIMIT_SEARCH

__all__ = [
    "limiter",
    "RATE_LIMIT_CHAT",
    "RATE_LIMIT_INGEST",
    "RATE_LIMIT_SEARCH",
]


def _rate_limit_key(request: Request) -> str:
    auth = request.headers.get("Authorization") or ""
    if auth.lower().startswith("bearer ") and len(auth) > 15:
        token = auth.split(" ", 1)[1].strip()
        digest = hashlib.sha256(token.encode("utf-8")).hexdigest()[:32]
        return f"bearer:{digest}"
    return get_remote_address(request)


def _rate_limit_enabled() -> bool:
    flag = os.getenv("RATE_LIMIT_ENABLED", "true").lower()
    if flag in {"0", "false", "no", "off"}:
        return False
    # Unit tests import the app under pytest — keep them deterministic.
    if "pytest" in sys.modules:
        return False
    return True


limiter = Limiter(
    key_func=_rate_limit_key,
    default_limits=[],
    enabled=_rate_limit_enabled(),
)
