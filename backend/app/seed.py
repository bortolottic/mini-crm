"""Carga inicial idempotente (SPEC §6.3, `app/seed.py`).

    python -m app.seed          # cwd = backend/

Roda a cada subida do container (entrypoint.sh) e pode ser repetido sem efeito
colateral: cada passo verifica antes de inserir. Os passos são registrados
conforme as fases criam as tabelas:

* F1 — Admin inicial (ADMIN_EMAIL / ADMIN_PASSWORD)
* F3 — origens e motivos de perda
* F5 — pipeline padrão
* F8 — system_settings
"""

from collections.abc import Callable

import structlog
from sqlalchemy.orm import Session

from app.core.db import get_sessionmaker
from app.core.logging import configure_logging

log = structlog.get_logger("seed")

SeedStep = Callable[[Session], None]

STEPS: list[tuple[str, SeedStep]] = []


def run() -> None:
    configure_logging()
    if not STEPS:
        log.info("seed_nothing_to_do")
        return
    with get_sessionmaker()() as session, session.begin():
        for name, step in STEPS:
            log.info("seed_step", step=name)
            step(session)
    log.info("seed_done", steps=len(STEPS))


if __name__ == "__main__":
    run()
