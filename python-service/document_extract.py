"""Extract plain text from uploaded document files for RAG ingestion."""

from __future__ import annotations

from pathlib import Path

from fastapi import HTTPException

# Keep in sync with the documents UI accept attribute.
ALLOWED_EXTENSIONS = {
    ".txt",
    ".md",
    ".markdown",
    ".csv",
    ".json",
    ".html",
    ".htm",
    ".pdf",
}

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


def _extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def extract_text_from_bytes(filename: str, data: bytes) -> str:
    """
    Decode uploaded bytes into plain text.

    Raises HTTPException for unsupported types or empty extracts.
    """
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large (max {MAX_UPLOAD_BYTES // (1024 * 1024)} MB)",
        )

    ext = _extension(filename)
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext or '(none)'}'. Allowed: {allowed}",
        )

    if ext == ".pdf":
        text = _extract_pdf(data)
    else:
        text = _decode_text(data)

    cleaned = text.strip()
    if not cleaned:
        raise HTTPException(
            status_code=400,
            detail="No extractable text found in file",
        )

    return cleaned


def _decode_text(data: bytes) -> str:
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise HTTPException(status_code=400, detail="Could not decode file as text")


def _extract_pdf(data: bytes) -> str:
    try:
        from io import BytesIO

        from pypdf import PdfReader
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="PDF support is not installed (pypdf missing)",
        ) from exc

    try:
        reader = PdfReader(BytesIO(data))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read PDF: {exc}",
        ) from exc

    pages: list[str] = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        if page_text.strip():
            pages.append(page_text.strip())

    return "\n\n".join(pages)
