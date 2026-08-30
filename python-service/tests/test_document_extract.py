from fastapi import HTTPException
import pytest

from document_extract import extract_text_from_bytes


def test_extract_plain_text():
    assert extract_text_from_bytes('notes.md', b'# Hello') == '# Hello'


def test_rejects_unsupported_extension():
    with pytest.raises(HTTPException) as exc:
        extract_text_from_bytes('photo.png', b'not-a-png')
    assert exc.value.status_code == 400


def test_rejects_empty_text():
    with pytest.raises(HTTPException) as exc:
        extract_text_from_bytes('empty.txt', b'   ')
    assert exc.value.status_code == 400
