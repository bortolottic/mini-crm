"""Extensões do PostgreSQL usadas pelo modelo (SPEC §4).

* pgcrypto — gen_random_uuid() nos ids;
* pg_trgm  — busca por similaridade (listas e busca global);
* citext   — e-mails sem diferenciar maiúsculas.

Revision ID: 0001
Revises:
Create Date: 2026-10-05
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

EXTENSIONS = ("pgcrypto", "pg_trgm", "citext")


def upgrade() -> None:
    for name in EXTENSIONS:
        op.execute(f'CREATE EXTENSION IF NOT EXISTS "{name}"')


def downgrade() -> None:
    for name in reversed(EXTENSIONS):
        op.execute(f'DROP EXTENSION IF EXISTS "{name}"')
