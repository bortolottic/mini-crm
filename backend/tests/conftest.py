"""Fixtures da suíte (SPEC §15).

* Testes **unit** não tocam banco.
* Testes marcados `db` usam o PostgreSQL de `TEST_DATABASE_URL` (padrão: o
  `minicrm_test` do docker-compose). O schema é criado uma vez por sessão via
  Alembic — a mesma migration que vai para produção — e cada teste roda dentro
  de uma transação revertida ao final (SAVEPOINT), então a ordem não importa.
"""

import os
from collections.abc import Iterator

# Antes de qualquer import de `app`: Settings é lido e cacheado na importação.
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault(
    "TEST_DATABASE_URL", "postgresql+psycopg://minicrm:minicrm@127.0.0.1:3434/minicrm_test"
)
os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-0123456789-0123456789")

import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import Connection, Engine, create_engine
from sqlalchemy.orm import Session

from app.api.v1.health import BACKEND_ROOT
from app.core.db import get_session
from app.main import create_app

TEST_DATABASE_URL = os.environ["TEST_DATABASE_URL"]


def alembic_config(connection: Connection | None = None) -> Config:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.attributes["skip_logging"] = True
    config.attributes["database_url"] = TEST_DATABASE_URL
    if connection is not None:
        config.attributes["connection"] = connection
    return config


@pytest.fixture(scope="session")
def engine() -> Iterator[Engine]:
    eng = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    with eng.begin() as conn:
        command.upgrade(alembic_config(conn), "head")
    yield eng
    eng.dispose()


@pytest.fixture
def db_session(engine: Engine) -> Iterator[Session]:
    """Sessão dentro de uma transação externa que é sempre revertida.

    `join_transaction_mode="create_savepoint"` faz o `session.begin()` dos
    services virar SAVEPOINT: o código de produção roda igual, e nada persiste.
    """
    with engine.connect() as connection:
        transaction = connection.begin()
        session = Session(bind=connection, join_transaction_mode="create_savepoint")
        try:
            yield session
        finally:
            session.close()
            transaction.rollback()


@pytest.fixture
def app() -> FastAPI:
    return create_app()


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    """Cliente sem banco (rotas que não dependem de sessão)."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture
def db_client(app: FastAPI, db_session: Session) -> Iterator[TestClient]:
    """Cliente cuja dependência `get_session` usa a sessão transacional do teste."""
    app.dependency_overrides[get_session] = lambda: db_session
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()
