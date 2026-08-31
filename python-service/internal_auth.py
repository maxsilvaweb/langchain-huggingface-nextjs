"""
Service-to-service auth for the Python API.

Next.js must send `X-Internal-Api-Key`. On GCP Cloud Run, callers also need a
Google ID token in `Authorization` (enforced by Cloud Run IAM). Convex JWTs
are passed via `X-Convex-Token` so they do not collide with the Google token.
"""

from __future__ import annotations

import hmac
import os

from fastapi import Header, HTTPException, Request
from fastapi.responses import JSONResponse

# Unauthenticated paths (Cloud Run startup probes, basic liveness).
PUBLIC_PATHS = frozenset({"/health", "/health/ready"})


def _configured_internal_key() -> str:
    return (os.getenv("INTERNAL_API_KEY") or "").strip()


def require_internal_api_key_enabled() -> bool:
    """
    When true (default), reject requests that lack a valid internal key.
    Set REQUIRE_INTERNAL_API_KEY=false only for emergency local debugging.
    """
    return os.getenv("REQUIRE_INTERNAL_API_KEY", "true").lower() not in {
        "0",
        "false",
        "no",
        "off",
    }


async def internal_api_key_middleware(request: Request, call_next):
    path = request.url.path
    if path in PUBLIC_PATHS:
        return await call_next(request)

    if not require_internal_api_key_enabled():
        return await call_next(request)

    expected = _configured_internal_key()
    if not expected:
        return JSONResponse(
            status_code=503,
            content={"detail": "INTERNAL_API_KEY is not configured on the API"},
        )

    provided = (request.headers.get("X-Internal-Api-Key") or "").strip()
    if not provided or not hmac.compare_digest(provided, expected):
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid or missing internal API key"},
        )

    return await call_next(request)


def extract_bearer(value: str | None) -> str | None:
    if not value:
        return None
    scheme, _, token = value.partition(" ")
    if scheme.lower() == "bearer" and token:
        return token.strip()
    # Allow raw token (no Bearer prefix)
    return value.strip() or None


def get_convex_token(
    authorization: str | None = Header(default=None),
    x_convex_token: str | None = Header(default=None, alias="X-Convex-Token"),
) -> str:
    """
    Resolve the Convex JWT.

    Prefer `X-Convex-Token` (required on GCP where `Authorization` is the
    Google identity token). Fall back to `Authorization` for local/dev.
    """
    token = extract_bearer(x_convex_token) or extract_bearer(authorization)
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing Convex token (X-Convex-Token or Authorization)",
        )
    return token
