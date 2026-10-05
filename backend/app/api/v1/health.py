"""Health checks (SPEC §7.3, §12.5). Públicos, sem autenticação."""

from pathlib import Path
from typing import Literal

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_session
from app.core.errors import AppError
from app.core.responses import Envelope, ok

router = APIRouter(prefix="/health", tags=["health"])

BACKEND_ROOT = Path(__file__).resolve().parents[3]


class Health(BaseModel):
    status: Literal["ok", "degraded"]
    db: Literal["ok", "fail"]
    version: str


class Readiness(BaseModel):
    status: Literal["ready"]
    revision: str | None


@router.get("", response_model=Envelope[Health])
def health(session: Session = Depends(get_session)) -> Envelope[Health]:
    try:
        session.execute(text("SELECT 1"))
        db_ok = True
    except SQLAlchemyError:
        db_ok = False
    return ok(
        Health(
            status="ok" if db_ok else "degraded",
            db="ok" if db_ok else "fail",
            version=get_settings().app_version,
        )
    )


def _head_revision() -> str | None:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "migrations"))
    return ScriptDirectory.from_config(config).get_current_head()


@router.get("/ready", response_model=Envelope[Readiness])
def ready(session: Session = Depends(get_session)) -> Envelope[Readiness]:
    """Pronto = banco acessível e com todas as migrations aplicadas."""
    unavailable = status.HTTP_503_SERVICE_UNAVAILABLE
    try:
        current = MigrationContext.configure(session.connection()).get_current_revision()
    except SQLAlchemyError as exc:
        raise AppError(
            "Banco de dados indisponível.", code="DB_UNAVAILABLE", status_code=unavailable
        ) from exc
    if current != _head_revision():
        raise AppError(
            "Há migrações pendentes no banco.", code="MIGRATIONS_PENDING", status_code=unavailable
        )
    return ok(Readiness(status="ready", revision=current))
