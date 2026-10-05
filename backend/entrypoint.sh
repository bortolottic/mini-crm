#!/bin/sh
# MINI-CRM — entrypoint do backend (mesma sequência do pro-ai-assistant).
#
# 1. Espera o PostgreSQL aceitar conexões.
# 2. alembic upgrade head  — fail-fast: schema quebrado não sobe.
# 3. python -m app.seed    — idempotente.
# 4. exec do comando (uvicorn em prod; debugpy + uvicorn no compose dev).
set -e

echo "[entrypoint] aguardando o PostgreSQL..."
python - <<'PY'
import sys, time
import psycopg
from app.core.config import get_settings

url = get_settings().database_url.replace("postgresql+psycopg://", "postgresql://")
for attempt in range(60):
    try:
        psycopg.connect(url, connect_timeout=3).close()
        break
    except psycopg.OperationalError:
        time.sleep(2)
else:
    sys.exit("[entrypoint] PostgreSQL indisponível após 120 s")
PY

echo "[entrypoint] aplicando migrações..."
python -m alembic upgrade head

echo "[entrypoint] carga inicial..."
python -m app.seed

echo "[entrypoint] iniciando: $*"
exec "$@"
