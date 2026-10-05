"""Logging estruturado em JSON (SPEC §12.1).

Uma linha JSON por evento em stdout, com `request_id` e `user_id` herdados do
contexto da requisição (structlog contextvars). Nunca registrar senha, token ou
corpo de requisição de autenticação.
"""

import logging
import sys

import structlog

from app.core.config import get_settings


def configure_logging() -> None:
    settings = get_settings()
    level = logging.getLevelNamesMapping().get(settings.log_level.upper(), logging.INFO)

    renderer: structlog.typing.Processor = (
        structlog.dev.ConsoleRenderer()
        if settings.app_env == "development" and sys.stderr.isatty()
        else structlog.processors.JSONRenderer()
    )

    shared: list[structlog.typing.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    structlog.configure(
        processors=[*shared, structlog.processors.EventRenamer("message"), renderer],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Bibliotecas que usam `logging` padrão (uvicorn, sqlalchemy, alembic).
    logging.basicConfig(level=level, stream=sys.stdout, format="%(message)s", force=True)
    logging.getLogger("uvicorn.access").disabled = True  # o middleware registra o acesso
    # /health/ready abre um MigrationContext a cada chamada; sem isto, duas linhas por sonda.
    logging.getLogger("alembic.runtime.migration").setLevel(logging.WARNING)
