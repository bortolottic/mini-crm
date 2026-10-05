# MINI-CRM

CRM web B2B compacto: Leads → Prospects → Clientes, oportunidades em pipeline, atividades e follow-ups, propostas com PDF, tudo com histórico preservado. Self-hosted via Docker e preparado para automações e IA.

| Documento | Conteúdo |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Produto: escopo, requisitos (RF), regras (RN), questões |
| [docs/SPEC.md](docs/SPEC.md) | Especificação técnica: modelo, API, regras, infraestrutura |
| [docs/PLANO.md](docs/PLANO.md) | Plano de execução por fases (F0–F10) e Definição de Pronto |

**Stack:** FastAPI · SQLAlchemy 2 · Alembic · PostgreSQL 16 · Vue 3 + TypeScript · Vite · Pinia · Tailwind (tokens do Vision.AI) · Docker Compose.

---

## Pré-requisitos

* Docker Desktop (Compose v2.24+)
* Python 3.12 (3.11 funciona) e Node 22
* VS Code com as extensões recomendadas (`.vscode/extensions.json`)

## Primeiro uso

```bash
cp .env.example .env            # ajuste ADMIN_PASSWORD / JWT_SECRET para o stack completo
```

No VS Code: **Terminal › Run Task › `setup: tudo`** (cria `.venv`, instala dependências Python e npm, sobe o banco e aplica as migrações).

Equivalente em linha de comando:

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r backend/requirements-dev.txt   # Linux/macOS: .venv/bin/python
(cd frontend && npm install)
docker compose up -d --wait database
(cd backend && DATABASE_URL=postgresql+psycopg://minicrm:minicrm@127.0.0.1:3434/minicrm ../.venv/Scripts/python -m alembic upgrade head)
```

## Rodando

| Objetivo | VS Code | Endereço |
|---|---|---|
| Depurar API + Web | Launch **`Tudo: API + Web`** | Web http://localhost:3100 · API http://localhost:3300/api/v1/docs |
| Só a API no depurador | Launch **`API: FastAPI (com docker)`** | http://localhost:3300 |
| Sem depurador, com reload | Task **`dev: subir tudo`** | idem |
| Como em produção | Task **`docker: subir stack completo`** | http://localhost:8080 |
| Depurar o backend dentro do container | Task **`docker: subir backend em container (debugpy)`** → Launch **`Anexar: backend em container`** | API :3300, debugpy :5679 |
| Portão de qualidade (= CI) | Task **`qualidade: tudo`** | — |

Stack completo por linha de comando: `docker compose up -d --build --wait`.

### Portas

| Serviço | Porta | Observação |
|---|---|---|
| PostgreSQL | 127.0.0.1:3434 | bancos `minicrm` e `minicrm_test`; usuário/senha `minicrm` em dev |
| API no host | 3300 | depurador / `api: subir servidor` |
| Vite | 3100 | proxy `/api` → 3300 |
| Proxy (stack completo) | 8080 | único serviço publicado em produção |
| debugpy (container) | 5679 | `docker-compose.dev.yml` |

> Use **`127.0.0.1`**, e não `localhost`, nas URLs do banco: no Windows `localhost` resolve primeiro para `::1` e cada conexão leva ~2 minutos para cair no IPv4.

## Testes

```bash
cd backend && ../.venv/Scripts/python -m pytest -q --cov=app   # exige o banco (docker compose up -d --wait database)
cd frontend && npx vitest run
cd frontend && npx playwright test                              # exige o stack completo em :8080
```

## Estrutura

```text
backend/    FastAPI — app/{api,core,domain,models,schemas,services,repositories,integrations,workers}, migrations/, tests/
frontend/   Vue 3 — src/{components,layouts,views,router,services,stores,composables,config,i18n,styles,types}, e2e/
docker/     nginx (proxy) e init do PostgreSQL
docs/       PRD, SPEC, PLANO
.vscode/    tarefas, launches e dev.env (valores só de desenvolvimento)
```

## Variáveis de ambiente

Ver [.env.example](.env.example). Em `APP_ENV=production` a API não sobe sem `JWT_SECRET` de 32+ caracteres. O `.env` nunca é versionado; `.vscode/dev.env` contém apenas valores de desenvolvimento.

## Operação

* Migrações e carga inicial rodam automaticamente na subida do container `backend` (`entrypoint.sh`).
* Saúde: `GET /api/v1/health` (API e banco) e `GET /api/v1/health/ready` (migrações em dia).
* Dados: volume Docker `minicrm_db_data`. A task `docker: derrubar stack e APAGAR os dados` remove o volume. Backup e restore são documentados na F10.
