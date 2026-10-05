"""Models SQLAlchemy.

Todo model novo DEVE ser importado aqui: é por este módulo que o Alembic
(`migrations/env.py`) enxerga o metadata no `--autogenerate`.
"""

from app.models.base import Base

__all__ = ["Base"]
