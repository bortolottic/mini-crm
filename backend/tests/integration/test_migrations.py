"""Toda migration é reversível (SPEC §4): upgrade → downgrade base → upgrade."""

import pytest
from alembic import command
from sqlalchemy import Engine, text

from tests.conftest import alembic_config

pytestmark = pytest.mark.db


def _extensions(engine: Engine) -> set[str]:
    with engine.connect() as conn:
        return set(conn.execute(text("SELECT extname FROM pg_extension")).scalars())


def test_upgrade_downgrade_roundtrip(engine: Engine) -> None:
    with engine.begin() as conn:
        command.downgrade(alembic_config(conn), "base")
    assert not {"pg_trgm", "citext"} & _extensions(engine)

    with engine.begin() as conn:
        command.upgrade(alembic_config(conn), "head")
    assert {"pgcrypto", "pg_trgm", "citext"} <= _extensions(engine)
