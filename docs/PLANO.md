# Plano de Execução — MINI-CRM (MVP)

**Deriva de:** [SPEC.md](SPEC.md) v1.0 · [PRD.md](PRD.md) v1.1
**Escopo:** MVP (P0). Fases P1 aparecem só como esboço no fim.
**Como usar:** cada fase é uma branch `fase-NN-nome` com PR próprio. A fase só termina quando passa no seu **Portão** e na **Definição de Pronto** global. As caixas `[ ]` são as tasks; marque-as no PR.

---

## 0. Visão geral

| Etapa | Fases | Resultado demonstrável |
|---|---|---|
| **A. Fundação** | F0 Scaffold · F1 Auth · F2 Eventos | Login funcionando no stack Docker, com auditoria |
| **B. Núcleo CRM** | F3 Empresas/Contatos · F4 Conversões | Lead cadastrado, qualificado e convertido, com timeline |
| **C. Vendas** | F5 Pipeline · F6 Atividades · F7 Propostas | Oportunidade no Kanban, follow-ups, proposta calculada |
| **D. Fechamento** | F8 PDF · F9 Busca/Config · F10 Hardening | Fluxo Lead → Cliente completo e aceite do MVP |

```text
F0 → F1 → F2 → F3 → F4 → F5 ─┬─ F6 ─┐
                             └─ F7 ─┴→ F8 → F9 → F10
```
F6 e F7 podem correr em paralelo (dependem só de F5). Tamanho relativo: S ≤ 1 d · M ≈ 2–3 d · L ≈ 4–5 d.

### Ambiente de desenvolvimento (já configurado)

| Item | Valor |
|---|---|
| PostgreSQL (Docker) | `127.0.0.1:3434`, bancos `minicrm` e `minicrm_test`, usuário/senha `minicrm` |
| API no host (depurador/reload) | `http://localhost:3300` |
| Vite dev server | `http://localhost:3100` (proxy `/api` → 3300) |
| Stack completo (proxy nginx) | `http://localhost:8080` |
| debugpy (backend em container) | `localhost:5679` |
| Variáveis do host | [.vscode/dev.env](../.vscode/dev.env) |

Fluxos no VS Code:
* **Primeiro uso:** tarefa `setup: tudo` → launch `Banco: carga inicial (seed)`.
* **Depurar API + Web:** launch `Tudo: API + Web` (sobe banco, aplica migrações, abre o Chrome).
* **Sem depurador:** tarefa `dev: subir tudo`.
* **Como em produção:** tarefa `docker: subir stack completo` → http://localhost:8080.
* **Depurar dentro do container:** tarefa `docker: subir backend em container (debugpy)` → launch `Anexar: backend em container`.
* **Portão local (= CI):** tarefa `qualidade: tudo`.

> **F0 concluída** (branch `fase-00-scaffold`): todas as tarefas e launches funcionam.

### Definição de Pronto (vale para toda fase)

- [ ] Migrations com `upgrade` **e** `downgrade` testados (`banco: reverter última migração` seguido de `banco: aplicar migrações`).
- [ ] Testes da fase verdes; cobertura de `services/` e `domain/` ≥ 80 %.
- [ ] `qualidade: tudo` verde (ruff, mypy, pytest, eslint, vitest, vue-tsc, lint de design, build).
- [ ] Endpoints novos documentados no OpenAPI, com códigos de erro da SPEC §7.1.
- [ ] Toda mudança de estado relevante publica evento (SPEC §8.2) na mesma transação.
- [ ] Telas novas com estados vazio, carregando e erro; textos em pt-BR via i18n; sem `v-html`; sem cor literal fora dos tokens.
- [ ] `docker: subir stack completo` funciona e a feature aparece em http://localhost:8080.
- [ ] README atualizado quando muda comando, variável ou porta.

---

## Etapa A — Fundação

### F0 · Scaffold e infraestrutura (M) — SPEC §2, §3, §13, §14

**Objetivo:** esqueleto executável em Docker e no host, com CI e todas as tarefas do VS Code funcionando.

Backend
- [x] `backend/pyproject.toml` (ruff, mypy, pytest config) + `requirements.txt` e `requirements-dev.txt`, com versões alinhadas ao Vision.AI (FastAPI 0.118, SQLAlchemy 2.0.44, Pydantic 2.12, pydantic-settings 2.11, PyJWT 2.10) + psycopg 3, alembic, argon2-cffi, structlog, weasyprint, babel, jinja2; dev: pytest, pytest-cov, httpx, ruff, mypy, debugpy.
- [x] `app/main.py` com `create_app()`, CORS a partir de `CORS_ORIGINS`, middleware `X-Request-ID` e handlers de erro (envelope da SPEC §7.1).
- [x] `core/config.py` (pydantic-settings; falha em `production` sem `JWT_SECRET` com 32+ caracteres), `core/db.py` (engine, sessão, Unit of Work), `core/logging.py` (JSON), `core/errors.py` (`AppError`), `core/pagination.py`.
- [x] `GET /api/v1/health` e `/health/ready`.
- [x] Alembic: `alembic.ini`, `migrations/env.py` lendo `DATABASE_URL`, migration `0001` criando as extensões `pgcrypto`, `pg_trgm` e `citext`.
- [x] `app/seed.py` (esqueleto idempotente, lê `ADMIN_*`).
- [x] `tests/conftest.py`: cria o schema no `minicrm_test` via Alembic, uma transação revertida por teste, `AsyncClient`.
- [x] `backend/Dockerfile` multi-stage com alvos **`prod`** (python:3.12-slim + pango/cairo/fontes do WeasyPrint, usuário não-root) e **`dev`** (+ requirements-dev/debugpy). `entrypoint.sh`: espera o banco → `alembic upgrade head` → `python -m app.seed` → uvicorn.

Frontend
- [x] Vite + Vue 3.5 + TS strict, Pinia, Vue Router, vue-i18n, Tailwind 3, lucide-vue-next, axios, @vueuse, nas mesmas versões do `vision_hub`.
- [x] `vite.config.ts`: porta **3100**, proxy `/api` → `http://localhost:3300`.
- [x] Copiar e adaptar do Vision.AI (SPEC §14): `tokens.css`, fontes Inter embarcadas, `tailwind.config.js`, `scripts/check-design.mjs`, primitivas `VModal`, `VTabs`, `VToasts`, `VPaginador`, `VIconButton`, `VFieldHint`, `AppLayout`.
- [x] `services/http.ts` (envelope, `ApiError`, ganchos de refresh vazios), router com rota `/` placeholder, tema claro/escuro.
- [x] Scripts npm: `dev`, `build` (lint:design + vue-tsc + vite build), `lint`, `test` (vitest), `lint:design`. ESLint com `vue/no-v-html: error`. Playwright instalado.
- [x] `frontend/Dockerfile` (node build → nginx estático com fallback SPA).

Infra e repositório
- [x] `docker/nginx/nginx.conf`: `/api/` → backend:8000, o resto → frontend:80, headers de segurança, `client_max_body_size 2m`.
- [ ] CI (GitHub Actions): os mesmos passos de `qualidade: tudo` + build das imagens + smoke `docker compose up --wait` + `curl /api/v1/health`. *(workflow escrito em `.github/workflows/ci.yml`; cada passo validado localmente; falta a primeira execução no GitHub, após o push)*
- [x] README (pré-requisitos, primeiro uso, portas, tarefas) e `CLAUDE.md` (comandos e convenções).
- [x] `docker-compose.yml`, `docker-compose.dev.yml`, `.env.example`, `.gitignore`, `docker/postgres/init`, `.vscode/*` *(feitos no planejamento)*.

**Portão F0:** num clone limpo, `setup: tudo` e `Tudo: API + Web` funcionam; o breakpoint em `/health` para; `docker: subir stack completo` responde em :8080; o CI está verde.

### F1 · Autenticação e usuários (L) — RF-01..05, RN-17, SPEC §6

Backend
- [ ] Models e migration de `users` e `refresh_tokens`.
- [ ] `core/security.py`: argon2id, política de senha, emissão e validação de JWT, refresh opaco com hash SHA-256.
- [ ] `auth_service`: login com rate limit e lockout, refresh rotativo com detecção de reuso (revoga a cadeia), logout, troca de senha, `must_change_password`.
- [ ] `deps.py`: `get_current_user` (checa `is_active`, cache de 30 s), `require_admin`; `policy.can_edit`.
- [ ] `users_service`: CRUD pelo Admin, reset de senha temporária, regra `LAST_ADMIN`.
- [ ] Seed do Admin inicial (`must_change_password` em produção).
- [ ] Rotas `/auth/*`, `/users*`, `/users/me`.

Frontend
- [ ] Store `auth` (token em memória), refresh com fila única no `http.ts`, guards (auth, papel, troca obrigatória de senha).
- [ ] Telas: Login, Troca de senha, Configurações › Perfil, Configurações › Usuários (Admin).
- [ ] `AppLayout` com menu da SPEC §13 (itens P1 ocultos por feature flag).

Testes
- [ ] Unit: política de senha, JWT.
- [ ] API: login ok/erro/lockout/429, refresh rotativo e `TOKEN_REUSED`, usuário inativo, troca obrigatória, matriz 403, `LAST_ADMIN`.
- [ ] Varredura automática do OpenAPI: toda rota fora da whitelist responde 401 sem token.

**Portão F1:** login, logout, refresh e troca de senha no stack Docker; o Vendedor recebe 403 nas telas e endpoints de Admin.

### F2 · Eventos e timeline base (M) — RN-14, RF-45, SPEC §2.3, §8

- [ ] Model e migration de `events` (índices de agregação).
- [ ] `core/events.py`: `EventData`, `publish(session, …)` na mesma transação, registro de handlers pós-commit (no-op no MVP).
- [ ] Teste de imutabilidade: nenhum repository expõe update ou delete de eventos.
- [ ] Teste de atomicidade: falha forçada após `publish` → rollback da alteração e do evento.
- [ ] Eventos `user_login`, `user_login_failed`, `user_created`, `user_deactivated`, `user_password_reset` publicados pela F1.
- [ ] `timeline_service` genérico (merge de eventos e atividades, paginação por cursor `before`), ainda sem rotas de entidade.
- [ ] Frontend: componente `Timeline.vue` (ícone por tipo, data relativa, "carregar mais") com testes Vitest.

**Portão F2:** os eventos de login aparecem em `events`; os testes de atomicidade e imutabilidade passam.

---

## Etapa B — Núcleo CRM

### F3 · Empresas, contatos e leads (L) — RF-10..12, 20..22, 25, 26, RN-01, 03, 12, 13, SPEC §4.2, §5.1, §5.5

Backend
- [ ] Migrations: `origins`, `loss_reasons`, `companies`, `contacts` (índices trigram, índices únicos parciais) + seed das listas.
- [ ] `domain`: enums, validação de CNPJ, máquina de estados `lead_status`.
- [ ] Repositories com filtro padrão `deleted_at IS NULL`, paginação, ordenação por whitelist e filtros da SPEC §7.3.
- [ ] `company_service` e `contact_service`: CRUD, ownership, duplicidade (409), exclusão lógica com regras, `recompute_company_stage`, disqualify e reactivate, eventos.
- [ ] Rotas: `/companies*`, `/contacts*`, aliases `/leads`, `/prospects`, `/customers`, `/contacts/check-duplicate`, `/origins`, `/loss-reasons`, timelines de contato e empresa.

Frontend
- [ ] `useListQuery` (filtros na query string, debounce, paginação).
- [ ] Listas: Empresas, Contatos, Leads, Prospects, Clientes (colunas por estágio).
- [ ] Formulários de empresa e contato (máscara de CNPJ e telefone, aviso de possível duplicata).
- [ ] Telas de detalhe com abas (Dados · Oportunidades · Atividades · Propostas · Histórico), as não implementadas desabilitadas.
- [ ] Ações de status do lead (avançar, desqualificar com motivo, reativar).
- [ ] Configurações › Listas (origens e motivos de perda).

Testes
- [ ] CNPJ, transições de `lead_status`, unicidade, regras de exclusão, derivação do estágio da empresa (inclusive troca de empresa do contato), Vendedor editando registro alheio → 403.

**Portão F3:** cadastrar empresa e contato, levar o lead até `Qualificado`, ver tudo na timeline; CNPJ inválido ou duplicado é rejeitado.

### F4 · Conversões de ciclo de vida (M) — RF-23, 24, RN-02, 05, 06, SPEC §5.1

- [ ] `convert_to_prospect` (com criação opcional de oportunidade como gancho, ativado na F5), `convert_to_customer` manual, `lifecycle_reverted` (Admin), `POST /contacts/{id}/anonymize` (opcional aqui ou na F10).
- [ ] Rotas `convert-to-prospect` e `convert-to-customer`.
- [ ] Frontend: modais de conversão com explicação do efeito; badges de estágio; ações no cabeçalho do detalhe.
- [ ] Testes: bloqueio sem `qualified`, histórico preservado (eventos anteriores visíveis após converter), recálculo da empresa, reversão restrita ao Admin.

**Portão F4:** Lead → Prospect → Cliente (manual) com a timeline contínua.

---

## Etapa C — Vendas

### F5 · Pipeline e oportunidades (L) — RF-30..36, RN-04, 07, 08, SPEC §5.2

Backend
- [ ] Migrations: `pipeline_stages` (seed do pipeline padrão), `opportunities` (com `version`), `opportunity_stage_history`.
- [ ] `PUT /pipeline/stages` com as invariantes (um `won`, um `lost`, ordem, desativação em vez de exclusão).
- [ ] `opportunity_service`: criação (bloqueio `CONTACT_IS_LEAD` e herança da empresa), edição com `If-Match`, `move` (probabilidade, motivo de perda, reabertura pelo Admin, `closed_at`, histórico, evento), **conversão automática em Cliente** ao ganhar, exclusão com regras.
- [ ] `GET /pipeline/board` (totais e contagem por coluna, limite de 50 cards e `has_more`).
- [ ] Ativar "criar oportunidade" na conversão Lead → Prospect (F4).

Frontend
- [ ] Kanban: drag and drop, atualização otimista com rollback, modal de motivo ao perder, confirmação ao ganhar, menu "Mover para…", totais, filtros, "carregar mais" por coluna.
- [ ] Lista e detalhe da oportunidade; aba Oportunidades em contato e empresa; Configurações › Pipeline (Admin).
- [ ] Tratamento de `VERSION_CONFLICT` (aviso e recarga).

Testes
- [ ] `move` (todos os ramos), conversão automática, reabertura 403/ok, `If-Match`, totais do board; Vitest do Kanban (otimista e rollback).

**Portão F5:** criar oportunidade de prospect, arrastar até Ganho e ver o contato virar Cliente; perder exige motivo.

### F6 · Atividades e follow-ups (M) — RF-40..44, RN-15, SPEC §5.4

- [ ] Migration de `activities` (CHECK de vínculo, índice parcial de pendentes).
- [ ] `activity_service`: herança de vínculos, `note` concluída na criação, complete e cancel, "já realizada", `last_interaction_at`, `next_action`, `overdue` calculado.
- [ ] Rotas `/activities*` e `/activities/summary`; `next_action` no detalhe de contato e oportunidade; atividades na timeline.
- [ ] Frontend: modal rápido "Registrar atividade" (detalhe e card do Kanban), tela Tarefas e Follow-ups (filtros, atalho "Atrasadas"), Home "Minhas tarefas", badge de atrasado com texto.
- [ ] Testes: herança, `last_interaction_at` por tipo, atrasados, permissões.

**Portão F6:** criar tarefa, registrar ligação e reunião, definir follow-up; o follow-up vencido aparece como "Atrasado".

### F7 · Catálogo e propostas (L) — RF-50, 60..66, 68, 69, RN-09..11, SPEC §5.3

Backend
- [ ] Migrations: `products`, `proposals`, `proposal_items`, `proposal_sequences`.
- [ ] `domain/proposal_calc.py` com a **tabela de verdade da SPEC §5.3 primeiro (TDD)**; `domain/proposal_status.py`.
- [ ] `proposal_service`: numeração com `FOR UPDATE`, snapshot do preço, desconto em % convertido para valor, bloqueio fora de `draft`, send/accept/reject/cancel/revise, expiração efetiva, sugestões RN-09, `OPPORTUNITY_CLOSED`.
- [ ] Rotas `/products*`, `/proposals*`, `/proposals/preview-totals`.

Frontend
- [ ] CRUD do catálogo (só leitura para o Vendedor).
- [ ] Formulário de proposta (itens editáveis, seletor de produto, item avulso, alternância R$/%, totais via `preview-totals`), visualização somente leitura, ações por status, sugestão de mover a oportunidade, aba Propostas.
- [ ] `useMoney` com testes.

Testes
- [ ] Cálculo (tabela completa), transições inválidas (409), numeração concorrente (duas criações simultâneas), revisão, expiração.

**Portão F7:** criar proposta com produtos, desconto e total corretos; enviar a bloqueia; revisar cria a nova; aceitar sugere Ganho.

---

## Etapa D — Fechamento

### F8 · PDF da proposta (M) — RF-67, SPEC §9

- [ ] Migration de `system_settings` + `GET/PUT /settings` e `/settings/logo` (validação por magic bytes, até 512 KB).
- [ ] `integrations/pdf`: template Jinja2 (autoescape), CSS com os tokens, Inter embarcada, formatação pt-BR (babel), marcas d'água RASCUNHO e CANCELADA, "Página x de y".
- [ ] `GET /proposals/{id}/pdf`; botão "Baixar PDF".
- [ ] Configurações › Sistema (dados do emissor, logo, rodapé, validade e condições padrão).
- [ ] Testes: bytes `%PDF`, extração do texto conferindo número, itens e total persistido; marca d'água; logo inválido rejeitado.
- [ ] Conferir que a imagem `prod` gera o PDF (as libs nativas estão nela).

**Portão F8:** PDF gerado no stack Docker, idêntico aos valores da tela.

### F9 · Busca simples e configurações finais (S) — Q-11, SPEC §7.3

- [ ] `GET /search` (trigram, agrupado por tipo, expansão por empresa).
- [ ] Caixa de busca global no topo (atalho `/` ou `Ctrl+K`), resultados agrupados.
- [ ] `GET /audit` (Admin) e tela simples de auditoria.
- [ ] Testes de busca (empresa traz contatos, oportunidades e propostas).

**Portão F9:** buscar "Empresa XYZ" retorna a empresa e tudo o que está vinculado a ela.

### F10 · Hardening e aceite do MVP (M) — PRD §11, §17, SPEC §12, §15, §17

- [ ] E2E Playwright do fluxo principal (SPEC §15) rodando no CI contra o stack Docker.
- [ ] `scripts/seed_demo.py` (50k contatos e 10k oportunidades) + k6 ou locust nas 6 consultas críticas; registrar p95 e ajustar índices e `EXPLAIN`.
- [ ] Segurança: headers e CSP no nginx, `pip-audit`, `npm audit`, revisão de logs (sem dados sensíveis), `COOKIE_SECURE` em produção.
- [ ] LGPD: anonimização (se não feita na F4).
- [ ] Operação: `docker/scripts/backup.sh` e `restore.sh`, healthchecks, `restart` policies, seção de backup no README.
- [ ] Acessibilidade: teclado no Kanban, foco visível, contraste AA, estado sempre com texto.
- [ ] Percorrer a matriz de aceite (SPEC §17) e marcar cada item com evidência (teste ou print).
- [ ] Teste de instalação limpa cronometrado (meta < 10 min) e tempo de cadastro de lead (< 30 s).
- [ ] Tag `v0.1.0` e changelog.

**Portão F10 = aceite do MVP:** todos os critérios do PRD §17 verificados.

---

## Pendências que bloqueiam fases (SPEC §19)

Decidir **antes** da fase indicada. Sem decisão, vale o padrão da SPEC.

| Pendência | Bloqueia | Padrão se não decidido |
|---|---|---|
| `If-Match` / `version` | F5 | adotar |
| PDF síncrono com WeasyPrint | F8 (validar na F0, já que a imagem precisa das libs) | adotar |
| Refresh token em cookie HttpOnly | F1 | adotar |
| Prefixo dos tokens CSS (`--v-` ou `--m-`) | F0 | manter `--v-` |
| Anonimização LGPD no MVP | F4/F10 | fazer na F10 |

---

## Após o MVP — esboço do P1

| Fase | Conteúdo | Observação |
|---|---|---|
| P1-a | Tags + Dashboard | só consultas sobre o modelo atual |
| P1-b | E-mail (SMTP), templates, recuperação de senha por e-mail | `integrations/smtp.py`, `email_*` |
| P1-c | Scheduler (APScheduler em container) + cadências + expiração persistida de propostas | baseado no `pro_ai_scheduler`; novo serviço no compose, novo launch `Worker: scheduler` |
| P1-d | Agenda (calendário) | só front-end |

Cada fase P1 exige uma SPEC-P1 detalhada antes de começar.
