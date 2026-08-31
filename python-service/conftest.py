import os

# Must be set before the FastAPI app middleware evaluates requests.
os.environ.setdefault("INTERNAL_API_KEY", "test-internal-api-key")
os.environ.setdefault("REQUIRE_INTERNAL_API_KEY", "true")
