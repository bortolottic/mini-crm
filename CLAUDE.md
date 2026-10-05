# CLAUDE.md

Guia para agentes trabalhando neste repositório.

## Contexto

MINI-CRM: CRM B2B self-hosted. A fonte da verdade é **docs/SPEC.md** (técnica), derivada de **docs/PRD.md** (produto); a execução segue **docs/PLANO.md** (fases F0–F10, uma branch `fase-NN-nome` por fase, com Definição de Pronto). Requisitos são referenciados por ID: `RF-nn`, `RN-nn` (PRD) e seções `§` da SPEC.

## Comandos

Backend (cwd `backend/`, venv na raiz em `.venv`; no Windows o interpretador é `../.venv/Scripts/python.exe`):

```bash
python -m uvicorn app.main:app --port 3300 --reload --env-file ../.vscode/dev.env
python -m alembic upgrade head            # DATABASE_URL obrigatório (ver .vscode/dev.env)
python -m alembic revision --autogenerate -m "descricao"
python -m app.seed
python -m pytest -q                        # usa minicrm_test em 127.0.0.1:3434
python -m pytest tests/unit -q             # sem banco
python -m ruff check . && python -m ruff format --check . && python -m mypy app
```

Frontend (cwd `frontend/`):

```bash
npm run dev            # :3100, proxy /api → 127.0.0.1:3300
npm run lint && npx vitest run && npm run build   # build = lint de design + vue-tsc + vite
npx playwright test    # contra o stack em :8080
```

Docker (raiz): `docker compose up -d --wait database` (só banco) · `docker compose up -d --build --wait` (stack em :8080).

## Convenções do backend

* Camadas: `api → services → (domain, repositories) → models` (SPEC §2.2). Routers não têm regra de negócio nem fazem commit; **o service controla a transação** (`with session.begin():`). `domain/` não importa SQLAlchemy nem nada de fora de `domain/`.
* Respostas sempre no envelope (`app/core/responses.py`: `ok`, `paginated`); erros sempre via subclasses de `AppError` (`app/core/errors.py`) com `code` estável em SNAKE_UPPER e `message` em pt-BR.
* Mudança de estado relevante publica evento na **mesma transação** (SPEC §2.3, §8). A tabela `events` é imutável.
* Dinheiro em `Decimal`/`NUMERIC(14,2)`, serializado como string; datas `timestamptz` em UTC.
* Todo model novo é importado em `app/models/__init__.py` (o Alembic depende disso). Toda migration tem `downgrade` funcional; revise o arquivo autogerado.
* Testes com banco usam as fixtures `db_session`/`db_client` (transação revertida por teste) e o marcador `pytest.mark.db`.
* Use `127.0.0.1`, nunca `localhost`, nas URLs do banco (no Windows `localhost` → `::1` → ~2 min de timeout).

## Convenções do frontend

* Cores, raio, sombra e espaçamento **só** pelos tokens `--v-*` de `src/styles/tokens.css` (copiados do Vision.AI). O `npm run lint:design` reprova cor literal, raio/sombra fora da escala e fonte remota.
* Componentes de UI reutilizáveis em `components/ui/` (`VModal`, `VTabs`, `VToasts`, `VPaginador`, `VIconButton`, `VFieldHint`); classes globais `.v-*` (botões, inputs, tabelas, blocos) vêm do `tokens.css`.
* Toda chamada HTTP passa por `services/http.ts` (desembrulha o envelope, normaliza em `ApiError`, refresh de token com fila única). Nunca usar `axios` direto em views.
* Textos via vue-i18n (`src/i18n/pt-BR.ts`). `v-html` é proibido (regra ESLint).
* Estado/severidade nunca só por cor: sempre com texto ou ícone.
* Itens de menu e rotas vêm de `src/config/navigation.ts`; telas de fases futuras usam `PlaceholderView` até a fase entregar a real. Itens P1 ficam atrás de `src/config/features.ts`.
