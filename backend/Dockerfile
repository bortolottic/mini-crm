# MINI-CRM — backend (SPEC §13.1).
#   target prod : imagem de produção (usuário não-root, sem ferramentas de dev)
#   target dev  : + requirements-dev (debugpy, pytest) — usado pelo docker-compose.dev.yml

FROM python:3.12-slim AS base

# XDG_CACHE_HOME: o fontconfig (WeasyPrint) precisa de um cache gravável; o
# usuário não-root não escreve em /app e cada PDF registrava "No writable cache".
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    XDG_CACHE_HOME=/tmp/.cache \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Bibliotecas nativas do WeasyPrint (PDF de proposta) + fontes para fallback.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz0b libharfbuzz-subset0 \
      libcairo2 libgdk-pixbuf-2.0-0 shared-mime-info fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt


FROM base AS dev
COPY requirements-dev.txt .
RUN pip install -r requirements-dev.txt
COPY . .
ENTRYPOINT ["sh", "/app/entrypoint.sh"]


FROM base AS prod
RUN groupadd --system app && useradd --system --gid app --home /app app
COPY --chown=app:app . .
USER app
EXPOSE 8000
ENTRYPOINT ["sh", "/app/entrypoint.sh"]
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY:-2} --proxy-headers --forwarded-allow-ips='*'"]
