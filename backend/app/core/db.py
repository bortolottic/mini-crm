"""Engine e sessões do SQLAlchemy (SPEC §2.3).

A transação pertence ao *service*: routers recebem a sessão por `get_session`
e a repassam; o service abre `with session.begin():` e é ele quem decide commit
ou rollback. Nenhum router chama `commit()`.
"""

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


@lru_cache
def get_engine() -> Engine:
    settings = get_settings()
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )


@lru_cache
def get_sessionmaker() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False)


def get_session() -> Iterator[Session]:
    """Dependência FastAPI: uma sessão por requisição, sempre fechada."""
    session = get_sessionmaker()()
    try:
        yield session
    finally:
        session.close()
