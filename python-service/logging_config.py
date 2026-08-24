"""
Structured Logging Configuration

Provides JSON-formatted logs with trace IDs for production observability.
Integrates with LangSmith tracing when enabled.
"""

import logging
import os
import sys
import uuid
from contextvars import ContextVar
from typing import Any

import structlog

# Context variable for request trace ID
trace_id_var: ContextVar[str] = ContextVar("trace_id", default="no-trace")


def get_trace_id() -> str:
    """Get the current request's trace ID."""
    return trace_id_var.get()


def set_trace_id(trace_id: str | None = None) -> str:
    """Set a trace ID for the current request context."""
    tid = trace_id or str(uuid.uuid4())[:8]
    trace_id_var.set(tid)
    return tid


def add_trace_id(
    logger: logging.Logger,
    method_name: str,
    event_dict: dict[str, Any],
) -> dict[str, Any]:
    """Structlog processor to add trace ID to all log entries."""
    event_dict["trace_id"] = get_trace_id()
    return event_dict


def add_service_info(
    logger: logging.Logger,
    method_name: str,
    event_dict: dict[str, Any],
) -> dict[str, Any]:
    """Structlog processor to add service metadata."""
    event_dict["service"] = "langchain-rag-api"
    event_dict["version"] = "1.0.0"
    return event_dict


def configure_logging(json_logs: bool = True, log_level: str = "INFO"):
    """
    Configure structured logging for the application.
    
    Args:
        json_logs: If True, output JSON format. If False, output human-readable.
        log_level: Minimum log level (DEBUG, INFO, WARNING, ERROR)
    """
    # Determine if we should use JSON (production) or console (development)
    if json_logs and os.getenv("ENVIRONMENT", "development") == "production":
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            add_trace_id,
            add_service_info,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            renderer,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, log_level.upper())
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Also configure standard library logging to use structlog
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
    )


def get_logger(name: str | None = None) -> structlog.BoundLogger:
    """
    Get a structured logger instance.
    
    Args:
        name: Optional logger name (e.g., module name)
        
    Returns:
        A structlog bound logger
    """
    logger = structlog.get_logger()
    if name:
        logger = logger.bind(logger_name=name)
    return logger


# Initialize logging on module import
configure_logging(
    json_logs=os.getenv("JSON_LOGS", "false").lower() == "true",
    log_level=os.getenv("LOG_LEVEL", "INFO"),
)
