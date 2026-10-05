# SPEC — MINI-CRM

**Versão:** 1.0
**Status:** Draft para implementação
**Deriva de:** [PRD.md](PRD.md) v1.1
**Escopo desta SPEC:** MVP (P0) em detalhe completo; P1 em nível de contrato e pontos de extensão; P2 apenas ganchos.

> Convenções: `RF-nn` / `RN-nn` / `Q-nn` referem-se ao PRD. Palavras **DEVE / NÃO DEVE / PODE** têm sentido normativo. Itens marcados **[DECISÃO]** fecham as Questões em Aberto do PRD adotando o padrão sugerido; podem ser revertidos antes do início da implementação do módulo afetado.

---

# 1. Decisões Fechadas

| Q | Decisão adotada |
|---|---|
| Q-01 | **FastAPI** + **PostgreSQL 16** + **SQLAlchemy 2** + **Alembic** + **Pydantic v2**; frontend **Vue 3 + TS + Vite + Pinia + Vue Router + vue-i18n + Tailwind 3 + lucide-vue-next + axios** (mesmo conjunto do `vision_hub`). PDF: **WeasyPrint**. Hash de senha: **argon2-cffi**. JWT: **PyJWT**. Scheduler (P1): **APScheduler** em container próprio (mesmo padrão do `pro_ai_scheduler`). |
| Q-02 | Lead/Prospect/Cliente = `lifecycle_stage` em `contacts` e `companies`. Sem tabela `leads`. |
| Q-03 | Repositórios de referência acessíveis; inventário de reaproveitamento na seção 14. |
| Q-04 | Single-tenant. Ponto de extensão: toda tabela de negócio NÃO terá `tenant_id` no MVP, mas o acesso a dados passa **exclusivamente** por repositories (ponto único para injetar filtro de tenant depois). |
| Q-05 | Vendedor **vê todos** os registros e **edita apenas** os que possui (`owner_id`) ou que criou; Admin edita tudo. |
| Q-06 | `companies.lifecycle_stage` é **derivado**: o mais avançado entre seus contatos ativos (`customer > prospect > lead`), recalculado pelo service a cada mudança de contato/oportunidade. Não é editável diretamente. |
| Q-07 | Importação CSV **fora do MVP** (P2). Acrescentar como P1 caso necessário. |
| Q-08 | Dados do emissor (razão social, CNPJ, endereço, contato, logo, rodapé) em tabela `system_settings`, editáveis pelo Admin. Template de PDF padrão único. |
| Q-09 | Moeda única BRL. Campo `currency` NÃO existe no MVP. |
| Q-10 | Sem anexos de arquivo no MVP. PDF de proposta é gerado sob demanda (não armazenado). |
| Q-11 | **Busca simples por nome** (`GET /search`, ILIKE + `pg_trgm`) entra no MVP como P0 reduzido. Dashboard e tags permanecem P1. |

---

# 2. Arquitetura

## 2.1 Visão de runtime

```text
Browser ──HTTPS──► nginx ──┬── /api/*  ──► backend (FastAPI/uvicorn :8000) ──► PostgreSQL :5432
                           └── /*      ──► frontend (nginx estático :80)
                                          (P1) scheduler (APScheduler) ──► PostgreSQL
```

* `nginx` é o único serviço publicado; `backend` e `database` ficam na rede interna do compose.
* O frontend **NÃO** chama o backend por URL absoluta; usa `/api/v1` relativo (evita CORS em produção). CORS configurável só para dev (`CORS_ORIGINS`).
* **Sem fila/broker no MVP.** PDF é gerado de forma síncrona na requisição (limite: 200 itens/proposta, timeout 15 s).

## 2.2 Camadas do backend

```text
api/v1/*.py          Routers: validação (schemas), autenticação/autorização (Depends), chamada ao service. SEM regra de negócio.
services/*.py        Casos de uso. Controlam a transação (Unit of Work), aplicam RN-xx, publicam eventos.
domain/*.py          Enums, máquinas de estado, cálculo de proposta, regras puras. SEM I/O, SEM SQLAlchemy.
repositories/*.py    Único ponto de acesso ao banco. Retornam models; filtros/paginação aqui.
models/*.py          Models SQLAlchemy declarativos.
schemas/*.py         Pydantic de entrada/saída (DTOs). Nunca expor models diretamente.
integrations/*.py    pdf (WeasyPrint), (P1) smtp.
core/*.py            config, db, security, logging, errors, deps, events.
```

Regras de dependência: `api → services → (domain, repositories) → models`. `domain` NÃO importa nada de fora de `domain`. `repositories` NÃO chamam `services`.

## 2.3 Transações e eventos

* **Unit of Work por requisição:** o service abre a transação (`session.begin()`); commit ao final com sucesso, rollback em exceção. Routers NÃO fazem commit.
* **Eventos de domínio (RN-14):** services chamam `events.publish(session, EventData(...))`, que **insere em `events` na mesma transação** da mudança. Alteração e evento são atômicos. No MVP não há consumidores assíncronos; o barramento é uma função síncrona com registro opcional de *handlers* em memória (`core/events.py`) para a futura automação (P2) — handlers rodam **após o commit**.
* Nenhum service escreve em `events` por outro caminho.

## 2.4 Estrutura de repositório

```text
mini-crm/
├── backend/
│   ├── app/
│   │   ├── main.py                 # create_app(), registra routers, middlewares, handlers
│   │   ├── api/v1/{auth,users,companies,contacts,opportunities,pipeline,activities,products,proposals,timeline,search,settings,lookups,health}.py
│   │   ├── core/{config,db,security,logging,errors,deps,events,pagination}.py
│   │   ├── domain/{enums,lifecycle,pipeline,proposal_calc,proposal_status,money}.py
│   │   ├── models/…  schemas/…  services/…  repositories/…
│   │   ├── integrations/pdf/{renderer.py,templates/proposal.html,templates/proposal.css}
│   │   └── seed.py                 # admin inicial, pipeline padrão, origens, motivos de perda, settings
│   ├── migrations/ (alembic)
│   ├── tests/{unit,integration,api}/
│   ├── Dockerfile  alembic.ini  pyproject.toml  entrypoint.sh
├── frontend/   (ver seção 11)
├── docker/nginx/{nginx.conf,nginx.dev.conf}
├── docker-compose.yml  docker-compose.dev.yml  .env.example  README.md
└── docs/{PRD.md,SPEC.md}
```

---

# 3. Convenções Gerais

| Tema | Regra |
|---|---|
| **IDs** | UUID v4 (`uuid` no Postgres, `gen_random_uuid()` via extensão `pgcrypto`). Exceção: `proposals.number` é sequencial legível além do UUID. |
| **Datas** | `timestamptz` em UTC. API em ISO-8601 com `Z`. Campos de data civil (`expected_close`, `validity_date`) são `date`. Frontend converte para `DEFAULT_TIMEZONE` (RN-16). |
| **Dinheiro** | `NUMERIC(14,2)`; API serializa como **string decimal** (`"1234.50"`) para evitar float; Pydantic `Decimal`. Frontend usa string/`Intl.NumberFormat('pt-BR')`. |
| **Percentual** | `NUMERIC(5,2)` (0–100). |
| **Auditoria de linha** | Toda tabela de negócio: `created_at`, `updated_at` (trigger ou `onupdate`), `created_by`, `updated_by` (FK `users`, nullable). |
| **Exclusão** | Exclusão lógica via `deleted_at` em `companies`, `contacts`, `opportunities`, `proposals`, `products`, `activities`. Repositories filtram `deleted_at IS NULL` por padrão. |
| **Concorrência** | Coluna `version INT` em `opportunities` e `proposals`; `PUT/PATCH` exigem header `If-Match: <version>` **[DECISÃO]**; divergência → `409 VERSION_CONFLICT`. |
| **Strings** | `TRIM` na entrada; e-mail em minúsculas; CNPJ armazenado só com 14 dígitos, formatado na apresentação. |
| **i18n** | Mensagens de erro da API em pt-BR; `error.code` estável em inglês `SNAKE_UPPER`. Frontend traduz por `code` quando houver chave. |

---

# 4. Modelo de Dados

PostgreSQL 16. Extensões: `pgcrypto`, `pg_trgm`, `citext`. Todas as migrations via Alembic, reversíveis (`downgrade` implementado).

## 4.1 Enums (CHECK/ENUM nativo — usar `VARCHAR + CHECK` para facilitar migrations)

```text
user_role            : admin | seller
lifecycle_stage      : lead | prospect | customer
lead_status          : new | contacting | qualifying | qualified | disqualified | converted
lead_temperature     : cold | warm | hot
stage_type           : open | won | lost
activity_type        : call | meeting | task | email | note | follow_up | other
activity_status      : pending | done | canceled
activity_priority    : low | medium | high
proposal_status      : draft | sent | accepted | rejected | expired | canceled     (viewed reservado)
company_size         : micro | small | medium | large
related_type         : company | contact | opportunity | proposal
```

Rótulos em pt-BR ficam no frontend (i18n), não no banco.

## 4.2 Tabelas (MVP)

### `users`
| Coluna | Tipo | Restrições |
|---|---|---|
| id | uuid | PK |
| name | varchar(120) | NOT NULL |
| email | citext | NOT NULL, UNIQUE |
| password_hash | varchar(255) | NOT NULL |
| role | user_role | NOT NULL default `seller` |
| is_active | bool | NOT NULL default true |
| must_change_password | bool | NOT NULL default false |
| last_login_at | timestamptz | |
| failed_login_count / locked_until | int / timestamptz | bloqueio temporário (seção 6.3) |
| created_at, updated_at | timestamptz | |

### `refresh_tokens`
`id uuid PK`, `user_id FK`, `token_hash varchar(64) UNIQUE` (SHA-256), `expires_at`, `revoked_at`, `replaced_by uuid`, `user_agent`, `ip`, `created_at`. Índice em `user_id`.

### `origins`  /  `loss_reasons`  (listas configuráveis)
`id uuid PK`, `name varchar(80) NOT NULL UNIQUE`, `is_active bool default true`, `sort_order int`. Seed: origens `Indicação, Site, Evento, Outbound, Redes sociais, Outros`; motivos `Preço, Concorrente, Sem orçamento, Sem resposta, Projeto adiado, Sem fit, Outros`.

### `companies`
| Coluna | Tipo | Restrições |
|---|---|---|
| id | uuid | PK |
| legal_name | varchar(200) | NOT NULL |
| trade_name | varchar(200) | |
| cnpj | char(14) | UNIQUE parcial (`WHERE cnpj IS NOT NULL AND deleted_at IS NULL`), validado por dígito verificador |
| website, email, phone | varchar | |
| address, city, state(2), country(default 'BR'), zip_code | varchar | |
| segment | varchar(80) | |
| size | company_size | |
| notes | text | |
| owner_id | uuid FK users | NOT NULL |
| lifecycle_stage | lifecycle_stage | NOT NULL default `lead`; **derivado** (Q-06) |
| deleted_at, created_*, updated_* | | |

Índices: `gin (legal_name gin_trgm_ops)`, `gin (trade_name gin_trgm_ops)`, `(owner_id)`, `(lifecycle_stage)`.

### `contacts`
| Coluna | Tipo | Restrições |
|---|---|---|
| id | uuid | PK |
| first_name | varchar(100) | NOT NULL |
| last_name | varchar(100) | |
| email | citext | UNIQUE parcial (`WHERE email IS NOT NULL AND deleted_at IS NULL`) |
| phone, mobile, job_title | varchar | |
| company_id | uuid FK companies | nullable |
| notes | text | |
| origin_id | uuid FK origins | |
| owner_id | uuid FK users | NOT NULL |
| lifecycle_stage | lifecycle_stage | NOT NULL default `lead` |
| lead_status | lead_status | NOT NULL default `new` |
| lead_temperature | lead_temperature | |
| disqualified_reason | varchar(255) | obrigatório se `lead_status = disqualified` (CHECK) |
| last_interaction_at | timestamptz | mantido pelo service (RN-15) |
| deleted_at, created_*, updated_* | | |

Índices: trigram em `first_name || ' ' || coalesce(last_name,'')`, `(company_id)`, `(owner_id)`, `(lifecycle_stage, lead_status)`, `(last_interaction_at)`.

### `pipeline_stages`
`id uuid PK`, `name varchar(60) UNIQUE`, `sort_order int NOT NULL`, `stage_type stage_type NOT NULL`, `default_probability numeric(5,2) NOT NULL`, `is_active bool`.
Invariantes (validadas no service): exatamente **1** estágio `won` e **1** `lost` ativos obrigatórios (v1: podem ser vários `won`/`lost`? — NÃO; manter 1 de cada para simplificar); ao menos 1 `open`; `won`/`lost` sempre por último na ordenação; estágio com oportunidades não pode ser excluído (apenas desativado).
Seed: ver PRD 7.4.

### `opportunities`
| Coluna | Tipo | Restrições |
|---|---|---|
| id | uuid | PK |
| name | varchar(200) | NOT NULL |
| company_id | uuid FK | nullable |
| contact_id | uuid FK | NOT NULL |
| owner_id | uuid FK users | NOT NULL |
| stage_id | uuid FK pipeline_stages | NOT NULL |
| amount | numeric(14,2) | NOT NULL default 0, CHECK ≥ 0 |
| probability | numeric(5,2) | NOT NULL, CHECK 0–100 |
| expected_close | date | |
| origin_id | uuid FK origins | |
| notes | text | |
| loss_reason_id | uuid FK | obrigatório se estágio `lost` (CHECK via service) |
| loss_notes | text | |
| closed_at | timestamptz | preenchido ao entrar em `won`/`lost`; limpo ao reabrir |
| stage_changed_at | timestamptz | NOT NULL |
| version | int | NOT NULL default 1 |
| deleted_at, created_*, updated_* | | |

Índices: `(stage_id)`, `(owner_id)`, `(company_id)`, `(contact_id)`, `(expected_close)`, trigram em `name`.
Regra: se `company_id` nulo, herdar `contacts.company_id` na criação.

### `opportunity_stage_history`
`id uuid PK`, `opportunity_id FK`, `from_stage_id FK null`, `to_stage_id FK`, `changed_by FK users`, `changed_at timestamptz`, `time_in_previous_stage interval`. Índice `(opportunity_id, changed_at)`. (RF-34.)

### `activities`
| Coluna | Tipo | Restrições |
|---|---|---|
| id | uuid | PK |
| type | activity_type | NOT NULL |
| title | varchar(200) | NOT NULL |
| description | text | |
| owner_id | uuid FK users | NOT NULL |
| due_at | timestamptz | NOT NULL para `task`/`follow_up`/`meeting`/`call` agendadas; null permitido para `note` |
| status | activity_status | NOT NULL default `pending` (`note` nasce `done`) |
| priority | activity_priority | NOT NULL default `medium` |
| completed_at | timestamptz | |
| contact_id, company_id, opportunity_id | uuid FK | **ao menos um** NOT NULL (CHECK); o service preenche os demais por herança (ex.: oportunidade ⇒ contato e empresa) |
| deleted_at, created_*, updated_* | | |

Em vez de `related_type/related_id` polimórfico (PRD §9), a SPEC usa **três FKs reais** com integridade referencial. Eventos continuam polimórficos (abaixo).
Índices: `(owner_id, status, due_at)`, `(contact_id, due_at)`, `(opportunity_id)`, `(company_id)`; parcial `(due_at) WHERE status='pending'`.
**"Atrasada"** = `status='pending' AND due_at < now()` — campo calculado no SELECT, nunca persistido (RF-42).

### `products`
`id`, `code varchar(40) UNIQUE (parcial, ativos)`, `name varchar(200) NOT NULL`, `description text`, `category varchar(80)`, `unit varchar(20) NOT NULL default 'un'`, `default_price numeric(14,2) NOT NULL ≥0`, `is_active bool`, auditoria, `deleted_at`.

### `proposals`
| Coluna | Tipo | Restrições |
|---|---|---|
| id | uuid | PK |
| number | varchar(12) | UNIQUE NOT NULL, formato `AAAA-NNNN` |
| opportunity_id | uuid FK | NOT NULL |
| contact_id, company_id | uuid FK | copiados da oportunidade na criação (snapshot de vínculo) |
| owner_id | uuid FK users | NOT NULL |
| status | proposal_status | NOT NULL default `draft` |
| issue_date | date | NOT NULL default hoje |
| validity_date | date | NOT NULL, CHECK ≥ issue_date |
| lead_time | varchar(120) | prazo |
| payment_terms | varchar(255) | |
| notes | text | |
| global_discount | numeric(14,2) | NOT NULL default 0 |
| subtotal, discount_total, total | numeric(14,2) | NOT NULL — **persistidos** e recalculados pelo service em toda gravação de itens |
| revision_of | uuid FK proposals | nullable (cadeia de revisões) |
| sent_at, accepted_at, rejected_at, canceled_at | timestamptz | |
| sent_by, accepted_by(registrado por) | uuid FK users | |
| rejection_reason | text | |
| version, deleted_at, auditoria | | |

Numeração: tabela `proposal_sequences(year int PK, last_value int)`; incremento com `SELECT … FOR UPDATE` dentro da transação de criação (sem lacunas em caso de sucesso; lacunas por rollback são aceitáveis desde que o número não se repita).
Índices: `(opportunity_id)`, `(status)`, `(owner_id)`.

### `proposal_items`
`id`, `proposal_id FK ON DELETE CASCADE`, `position int`, `product_id FK null`, `description varchar(500) NOT NULL`, `unit varchar(20)`, `quantity numeric(12,3) CHECK > 0`, `unit_price numeric(14,2) CHECK ≥ 0`, `discount numeric(14,2) default 0 CHECK ≥ 0`, `total numeric(14,2)`. Unique `(proposal_id, position)`.

### `events`  (timeline + auditoria, RN-14)
| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| occurred_at | timestamptz NOT NULL default now() | |
| user_id | uuid FK null | null = sistema |
| type | varchar(60) NOT NULL | catálogo na seção 8.2 |
| entity_type | related_type NOT NULL | entidade principal |
| entity_id | uuid NOT NULL | |
| contact_id, company_id, opportunity_id | uuid null | **chaves de agregação denormalizadas** para montar timelines sem joins polimórficos |
| description | varchar(500) NOT NULL | texto pt-BR pronto para exibição |
| metadata | jsonb NOT NULL default '{}' | `{from, to, amount, …}` |

Índices: `(contact_id, occurred_at DESC)`, `(company_id, occurred_at DESC)`, `(opportunity_id, occurred_at DESC)`, `(entity_type, entity_id)`, `(type)`.
**Imutável:** sem UPDATE/DELETE pela aplicação (revogar no role do app em produção; teste automatizado garante que nenhum repository expõe essas operações). Exceção LGPD: anonimização (seção 12.3).

### `system_settings`
Linha única (`id = 1`): `issuer_legal_name, issuer_trade_name, issuer_cnpj, issuer_address, issuer_email, issuer_phone, issuer_website, issuer_logo_data (bytea ≤ 512 KB) + issuer_logo_mime, proposal_footer, default_validity_days (30), default_payment_terms`. `updated_at/by`.

## 4.3 Tabelas P1 (apenas para reservar nomes e relações)
`tags`, `entity_tags`, `email_accounts`, `email_templates`, `emails`, `cadences`, `cadence_steps`, `cadence_enrollments`, `scheduled_jobs`. Detalhamento fica para SPEC-P1; nenhuma tabela MVP precisa ser alterada para recebê-las.

## 4.4 Diagrama (resumo)

```text
users 1─N companies/contacts/opportunities/activities/proposals (owner_id)
companies 1─N contacts
companies 1─N opportunities;  contacts 1─N opportunities
pipeline_stages 1─N opportunities ;  opportunities 1─N opportunity_stage_history
opportunities 1─N proposals 1─N proposal_items N─1 products
contacts|companies|opportunities 1─N activities
* ─ emite ─► events (agregados por contact_id / company_id / opportunity_id)
```

---

# 5. Regras de Domínio (implementação)

## 5.1 Ciclo de vida — `domain/lifecycle.py` + `services/contact_service.py`

Transições de `contacts.lifecycle_stage`:

```text
lead ──(convert_to_prospect)──► prospect ──(convert_to_customer)──► customer
```

Não há retorno automático. Reversões manuais (`customer→prospect`, `prospect→lead`) PODEM ser feitas somente por Admin via `PATCH /contacts/{id}` com `lifecycle_stage` + `reason` e geram evento `lifecycle_reverted`.

Transições de `lead_status` válidas (aplicáveis apenas com `lifecycle_stage = lead`):

```text
new → contacting → qualifying → qualified → converted(*)
qualquer estado ≠ converted → disqualified (exige disqualified_reason)
disqualified → new   (reativação, evento lead_reactivated)
(*) `converted` é atribuído exclusivamente pela ação convert_to_prospect.
```

Saltos permitidos para frente (ex.: `new → qualifying`); retrocesso entre `contacting/qualifying/qualified` permitido. `converted` e `disqualified` não podem ser setados pelo PATCH genérico.

### `convert_to_prospect(contact_id, create_opportunity: bool, opportunity: OpportunityIn|None)`
1. Falha `409 LEAD_NOT_QUALIFIED` se `lead_status ≠ qualified` ou `lifecycle_stage ≠ lead`.
2. Define `lifecycle_stage = prospect`, `lead_status = converted`.
3. Publica `lead_converted` (metadata `{from_status}`).
4. Se `create_opportunity`, cria oportunidade (mesma transação) no primeiro estágio `open`.
5. Recalcula `companies.lifecycle_stage` (se houver).

### `convert_to_customer(contact_id)` — manual
Exige `lifecycle_stage = prospect` (caso contrário `409 INVALID_LIFECYCLE_TRANSITION`). Define `customer`, evento `customer_converted` (metadata `{trigger: "manual"}`).

### Conversão automática (RN-05)
No `opportunity_service.move()`, ao entrar em estágio `won`: se `contact.lifecycle_stage ≠ customer`, aplicar `customer` (aceitando origem `lead` ou `prospect` — se `lead`, executa também `lead_status = converted`) e publicar `customer_converted` com `{trigger: "opportunity_won", opportunity_id}`. Recalcular `company.lifecycle_stage`.

### Empresa derivada (Q-06)
`recompute_company_stage(company_id)`: `max(lifecycle_stage)` dos contatos ativos com ordem `lead < prospect < customer`; sem contatos ⇒ mantém valor atual (padrão `lead`). Chamada após: criar/editar/excluir contato, mudar `company_id` do contato (recalcula antiga e nova), conversões. Mudança gera evento `company_stage_changed` na empresa.

## 5.2 Pipeline — `domain/pipeline.py` + `services/opportunity_service.py`

`move(opportunity_id, to_stage_id, probability?, loss_reason_id?, loss_notes?, expected_version)`:

1. Carrega oportunidade `FOR UPDATE`; valida `version`.
2. Se `to_stage` inativo → `422 STAGE_INACTIVE`. Se igual ao atual → `200` sem efeito, sem evento.
3. Se `to_stage.type = lost`: exige `loss_reason_id` (`422 LOSS_REASON_REQUIRED`).
4. Se oportunidade já fechada (`won/lost`) e destino é `open`: exige papel Admin (RF-36, `403 REOPEN_FORBIDDEN`), evento extra `opportunity_reopened`, `closed_at = null`, `loss_*` limpos.
5. Aplica RN-07: `probability = payload.probability ?? to_stage.default_probability`; `won ⇒ 100`, `lost ⇒ 0` (forçado).
6. `stage_changed_at = now()`; se `won/lost`, `closed_at = now()`.
7. Insere `opportunity_stage_history`; incrementa `version`.
8. Publica `opportunity_stage_changed` `{from, to, from_name, to_name}`.
9. Se `won`: executa conversão automática (5.1).
10. Atualiza `expected_close` apenas se informado.

**Criação** (RN-04): contato deve ter `lifecycle_stage ∈ {prospect, customer}`; se `lead`, responde `409 CONTACT_IS_LEAD` com `details.can_convert = true` — o frontend oferece o fluxo de conversão e repete a criação. Estágio inicial = primeiro `open` por `sort_order` quando omitido; `probability` = padrão do estágio.

**Exclusão:** lógica; bloqueada se existir proposta `sent`/`accepted` (`409 HAS_ACTIVE_PROPOSALS`).

## 5.3 Propostas — `domain/proposal_calc.py`, `domain/proposal_status.py`

### Cálculo (RN-10) — função pura `calculate(items, global_discount) -> Totals`

```python
# Decimal; contexto com rounding=ROUND_HALF_UP
item.gross  = q2(quantity * unit_price)            # q2 = quantize("0.01", ROUND_HALF_UP)
item.total  = item.gross - item.discount           # discount em valor
subtotal    = sum(item.gross)
discount_total = sum(item.discount) + global_discount
total       = subtotal - discount_total
```

Validações: `item.discount ≤ item.gross`; `global_discount ≤ Σ item.total`; `total ≥ 0`; ≥ 1 item para enviar. Descontos em **percentual** são aceitos na entrada (`discount_type: "value"|"percent"`, `discount_input`) e convertidos para valor no service; o valor é o que persiste. Arredondamento **por item** conforme PRD.

Casos de teste obrigatórios (tabela de verdade em `tests/unit/test_proposal_calc.py`):

| qtd | unit | desc | esperado total |
|---|---|---|---|
| 3 | 33.33 | 0 | 99.99 |
| 1.5 | 10.01 | 0 | 15.02 (15.015→HALF_UP) |
| 2 | 100.00 | 10% (=20.00) | 180.00 |
| 1 | 50.00 | 50.01 | erro `DISCOUNT_EXCEEDS_ITEM` |
| global 5.00 sobre Σ=100 | | | 95.00 |

### Máquina de estados

```text
draft ──send──► sent ──accept──► accepted
  │               ├──reject──► rejected
  │               └──(validade vencida)──► expired
  └──cancel──► canceled        sent ──cancel──► canceled
```

| Ação | De | Para | Efeitos |
|---|---|---|---|
| `send` | draft | sent | exige ≥1 item e total > 0; `sent_at/by`; bloqueia edição; evento `proposal_sent`; retorna `suggestion: {move_opportunity_to: "Proposta"}` (RN-09) se a oportunidade estiver em estágio anterior |
| `accept` | sent | accepted | `accepted_at`, registrado por; evento `proposal_accepted`; retorna `suggestion: {move_opportunity_to_won: true}` |
| `reject` | sent | rejected | `rejected_at`, `rejection_reason` opcional; evento `proposal_rejected` |
| `cancel` | draft, sent | canceled | `canceled_at`; evento `proposal_canceled` |
| `revise` | sent, rejected, expired, canceled | **nova** proposta `draft` | copia itens/condições/desconto; novo `number`; `revision_of = original`; original permanece inalterada; evento `proposal_revised` na nova |

* `accepted` é terminal. Qualquer transição fora da tabela ⇒ `409 INVALID_PROPOSAL_TRANSITION`.
* Edição (itens/cabeçalho) apenas em `draft` ⇒ senão `409 PROPOSAL_LOCKED`.
* **Expiração (RN-11):** `effective_status = 'expired' if status='sent' and validity_date < today else status`. Calculado no schema de saída (`status` = efetivo; `stored_status` disponível). `accept`/`reject` sobre proposta efetivamente expirada ⇒ `409 PROPOSAL_EXPIRED` (o usuário deve revisar). No P1 o scheduler persiste `expired` + evento.
* Propostas em `draft` com oportunidade `won/lost` ⇒ permitido editar, mas `send` bloqueado (`409 OPPORTUNITY_CLOSED`).

## 5.4 Atividades — `services/activity_service.py`

* **Herança de vínculo:** ao criar com `opportunity_id`, preencher `contact_id`/`company_id` da oportunidade; com `contact_id`, preencher `company_id`. Ao menos um vínculo (CHECK).
* `note` nasce `done` com `completed_at = now()`.
* **Concluir** (`POST /activities/{id}/complete`): `status = done`, `completed_at = now()`; se `type ∈ {call, meeting, email}` atualiza `contacts.last_interaction_at` (RN-15). `task`, `follow_up`, `note`, `other` **não** atualizam **[DECISÃO RF-43]**. Evento `activity_completed`.
* **Registrar ligação/reunião já realizada:** `POST /activities` com `status: "done"` e `occurred_at` (grava em `due_at` e `completed_at`) — mesmo efeito de concluir.
* **Cancelar:** `status = canceled`; evento `activity_canceled`.
* **Próxima ação** (RN-15) = menor `due_at` entre `pending` do tipo `follow_up` (fallback: qualquer `pending`) do contato — calculada por query, exposta como `next_action` no detalhe do contato/oportunidade.
* **Visibilidade:** todos veem; edita/conclui apenas quem é `owner_id` ou Admin.

## 5.5 Exclusão e integridade (RN-12, RN-13)

| Entidade | Pode excluir quando | Efeito |
|---|---|---|
| Empresa | sem oportunidades **abertas** | `deleted_at`; contatos permanecem (company_id preservado, exibidos como "empresa removida") |
| Contato | sem oportunidades abertas | `deleted_at`; recalcula empresa |
| Oportunidade | sem propostas `sent/accepted` | `deleted_at`; propostas `draft` vinculadas também são removidas logicamente |
| Proposta | somente `draft` | `deleted_at` (as demais devem ser canceladas) |
| Produto | sempre | se referenciado, apenas `is_active=false` (a API converte DELETE em desativação e informa) |
| Usuário | nunca excluído | apenas inativado |

**Duplicatas (RN-13):** CNPJ e e-mail duplicados ⇒ `409 DUPLICATE_CNPJ` / `DUPLICATE_EMAIL` (violação do índice único parcial traduzida pelo handler). Alerta de "possível duplicata" (mesmo nome + empresa): `GET /contacts/check-duplicate?first_name=&last_name=&company_id=` consultado pelo frontend antes do submit; não bloqueia.

---

# 6. Autenticação e Autorização

## 6.1 Tokens
* **Access token:** JWT HS256, `exp` = `JWT_ACCESS_TTL_MINUTES` (padrão 15), claims `sub` (user id), `role`, `iat`, `jti`. Enviado em `Authorization: Bearer`. Mantido **em memória** no frontend (não em localStorage).
* **Refresh token:** string aleatória de 256 bits, **cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`**, TTL `JWT_REFRESH_TTL_DAYS` (padrão 7), armazenado como hash em `refresh_tokens`. **Rotação** a cada refresh (token antigo revogado, `replaced_by`); reutilização de token revogado ⇒ revoga toda a cadeia do usuário e retorna `401 TOKEN_REUSED`.
* Logout revoga o refresh token atual e limpa o cookie.
* Usuário inativo ⇒ `401 USER_INACTIVE` em qualquer uso (verificado a cada request pela `Depends(get_current_user)` consultando `is_active` — cache curto de 30 s permitido).

## 6.2 Autorização

Dependências: `require_auth`, `require_admin`. Matriz (RN-17, Q-05):

| Recurso | Admin | Seller |
|---|---|---|
| Usuários (CRUD, reset de senha) | ✔ | só `GET /users/me` e alterar a própria senha; `GET /users` (lista leve id/nome para selects) ✔ |
| Pipeline/estágios, origens, motivos, settings | ✔ | leitura |
| Empresas, contatos, oportunidades, atividades, propostas, produtos | CRUD total | leitura total; escrita se `owner_id = eu` ou `created_by = eu`; **criação livre**; `owner_id` pode ser atribuído a si; alterar `owner_id` para outro usuário: permitido apenas ao dono atual/Admin |
| Reabrir oportunidade fechada | ✔ | ✘ |
| Reversão manual de ciclo de vida | ✔ | ✘ |
| Produtos | CRUD | leitura |

Violação ⇒ `403 FORBIDDEN`. Checagem fica no **service** (`policy.can_edit(user, entity)`), não só no router, para manter consistência quando houver outros chamadores (worker/IA).

## 6.3 Senha e proteção
* Mínimo 10 caracteres, ao menos 1 letra e 1 número; não pode ser igual ao e-mail. Hash **argon2id**.
* Rate limit de login: 5 tentativas / 15 min por (IP + e-mail) em memória (single-instance) **[DECISÃO]**; após 5 falhas consecutivas `locked_until = now + 15 min` ⇒ `423 ACCOUNT_LOCKED`. Mensagem de falha genérica (`INVALID_CREDENTIALS`) sem revelar se o e-mail existe.
* **Recuperação de senha (RF-03) no MVP:** Admin gera senha temporária (`POST /users/{id}/reset-password` retorna a senha **uma única vez**), define `must_change_password = true`. Enquanto verdadeiro, só `change-password` e `me` são permitidos (`403 PASSWORD_CHANGE_REQUIRED`). Fluxo por e-mail com link: P1.
* **Primeiro Admin:** `seed.py` cria usuário com `ADMIN_EMAIL`/`ADMIN_PASSWORD` se `users` estiver vazio; ao ocorrer em `APP_ENV=production` exige `must_change_password = true`. Aplicação **NÃO** inicia em produção com `JWT_SECRET` vazio/fraco (<32 chars).

---

# 7. Contrato da API

Base: `/api/v1`. Content-Type JSON. Todos os endpoints (exceto `auth/login`, `auth/refresh`, `health`) exigem Bearer.

## 7.1 Envelope e erros

```json
// 2xx
{ "success": true, "data": <objeto|lista>, "meta": { "page": 1, "page_size": 20, "total": 120, "total_pages": 6 } }
// 4xx/5xx
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…pt-BR…", "details": [ { "field": "email", "code": "INVALID_EMAIL", "message": "…" } ] } }
```
`meta` só em listas. `204` apenas em logout/delete (sem corpo). Cabeçalho `X-Request-ID` em toda resposta (gerado se ausente).

| HTTP | Uso | Códigos principais |
|---|---|---|
| 400 | Requisição malformada | `BAD_REQUEST` |
| 401 | Não autenticado | `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `TOKEN_REUSED`, `INVALID_CREDENTIALS`, `USER_INACTIVE` |
| 403 | Sem permissão | `FORBIDDEN`, `PASSWORD_CHANGE_REQUIRED`, `REOPEN_FORBIDDEN` |
| 404 | Inexistente (ou excluído) | `<ENTIDADE>_NOT_FOUND` |
| 409 | Conflito de estado/duplicidade | `DUPLICATE_CNPJ`, `DUPLICATE_EMAIL`, `DUPLICATE_CODE`, `VERSION_CONFLICT`, `LEAD_NOT_QUALIFIED`, `INVALID_LIFECYCLE_TRANSITION`, `CONTACT_IS_LEAD`, `INVALID_PROPOSAL_TRANSITION`, `PROPOSAL_LOCKED`, `PROPOSAL_EXPIRED`, `OPPORTUNITY_CLOSED`, `HAS_OPEN_OPPORTUNITIES`, `HAS_ACTIVE_PROPOSALS` |
| 422 | Validação de campo/regra | `VALIDATION_ERROR`, `INVALID_CNPJ`, `LOSS_REASON_REQUIRED`, `STAGE_INACTIVE`, `DISCOUNT_EXCEEDS_ITEM`, `PROPOSAL_EMPTY` |
| 423 | Conta bloqueada | `ACCOUNT_LOCKED` |
| 429 | Rate limit | `RATE_LIMITED` |
| 500 | Inesperado | `INTERNAL_ERROR` (sem stack trace; id do request para correlação) |

Exceptions de domínio herdam de `AppError(code, http_status, message, details)`; um handler global converte tudo para o envelope.

## 7.2 Listagens

Parâmetros comuns: `page` (≥1, padrão 1), `page_size` (1–100, padrão 20), `sort` (`campo` ou `-campo`, whitelist por recurso), `q` (busca textual no recurso). Filtros por recurso abaixo. Datas de filtro em ISO. `total` calculado com `COUNT(*)` sobre o mesmo filtro.

## 7.3 Endpoints (MVP)

### Auth
| Método | Rota | Corpo → Resposta |
|---|---|---|
| POST | `/auth/login` | `{email, password}` → `{access_token, expires_in, user}` + cookie refresh |
| POST | `/auth/refresh` | (cookie) → `{access_token, expires_in}` + novo cookie |
| POST | `/auth/logout` | → 204 |
| POST | `/auth/change-password` | `{current_password, new_password}` → 204 |
| GET | `/users/me` | → `User` |

### Users (Admin; exceto `GET /users` leve)
`GET /users` (`?active=`), `POST /users` `{name,email,role,password}`, `GET|PATCH /users/{id}` (`name, role, is_active`), `POST /users/{id}/reset-password` → `{temporary_password}`. Impedir Admin de se desativar/rebaixar se for o último Admin ativo (`409 LAST_ADMIN`).

### Companies
`GET /companies` — filtros: `q, owner_id, lifecycle_stage, state, segment, size`
`POST /companies`, `GET /companies/{id}`, `PATCH /companies/{id}` (`If-Match` não exigido; contatos/empresas não têm `version`), `DELETE /companies/{id}`
`GET /companies/{id}/contacts`, `GET /companies/{id}/opportunities`
Detalhe inclui: `contacts_count`, `open_opportunities_count`, `open_pipeline_amount`, `lifecycle_stage` (derivado).

### Contacts
`GET /contacts` — filtros: `q, company_id, owner_id, lifecycle_stage, lead_status, lead_temperature, origin_id, has_overdue_followup, created_from/created_to`
`POST /contacts`, `GET /contacts/{id}`, `PATCH /contacts/{id}`, `DELETE /contacts/{id}`
`GET /contacts/check-duplicate`
`POST /contacts/{id}/convert-to-prospect` — `{create_opportunity?: bool, opportunity?: {name, amount, expected_close, …}}` → contato atualizado (+ `opportunity` se criada)
`POST /contacts/{id}/convert-to-customer` → contato atualizado
`POST /contacts/{id}/disqualify` `{reason}`; `POST /contacts/{id}/reactivate`
Visões: `GET /leads` ≡ `GET /contacts?lifecycle_stage=lead` (idem `/prospects`, `/customers`) — aliases com os mesmos filtros; `lead_status` só se aplica a `/leads`.
Detalhe inclui: `next_action`, `last_interaction_at`, `company` (resumido), `open_opportunities_count`.

### Pipeline e listas
`GET /pipeline/stages` (todos autenticados), `PUT /pipeline/stages` (Admin; corpo = lista completa ordenada; validação das invariantes 4.2; operação atômica), `GET /pipeline/board?owner_id=&q=` → `{stages:[{stage, total_amount, count, opportunities:[card…]}]}` (cada coluna limitada a 50 cards + `has_more`; carregamento adicional via `GET /opportunities?stage_id=&page=`).
`GET/POST/PATCH /origins`, `/loss-reasons` (escrita Admin; DELETE ⇒ desativa).

### Opportunities
`GET /opportunities` — filtros: `q, stage_id, stage_type, owner_id, company_id, contact_id, expected_close_from/to, amount_min/max, status(open|won|lost)`
`POST /opportunities`, `GET /opportunities/{id}`, `PATCH /opportunities/{id}` (campos cadastrais; **não** altera estágio; exige `If-Match`), `DELETE`
`POST /opportunities/{id}/move` — `{stage_id, probability?, loss_reason_id?, loss_notes?}` (exige `If-Match`) → oportunidade atualizada + `customer_converted: bool`
`GET /opportunities/{id}/stage-history`
Detalhe inclui: `proposals` (resumo), `next_action`, `stage_history_summary`.

### Activities
`GET /activities` — filtros: `owner_id, status, type, priority, overdue(bool), due_from, due_to, contact_id, company_id, opportunity_id`; padrão de ordenação `due_at ASC`
`POST /activities`, `GET /activities/{id}`, `PATCH /activities/{id}`, `POST /activities/{id}/complete`, `POST /activities/{id}/cancel`, `DELETE`
`GET /activities/summary?owner_id=` → `{pending, overdue, due_today}` (usado no cabeçalho/home)

### Products
`GET /products` (`q, category, is_active`), `POST`, `GET`, `PATCH`, `DELETE` (desativa se referenciado).

### Proposals
`GET /proposals` — filtros: `q, status, owner_id, opportunity_id, company_id, issue_from/to`
`POST /proposals` — `{opportunity_id, validity_date?, lead_time?, payment_terms?, notes?, items:[{product_id?, description, unit, quantity, unit_price, discount?, discount_type?}], global_discount?}`; defaults: `validity_date = hoje + default_validity_days`
`GET /proposals/{id}` (inclui itens e totais), `PUT /proposals/{id}` (substitui cabeçalho+itens; apenas `draft`; `If-Match`), `DELETE` (apenas `draft`)
`POST /proposals/{id}/send | accept | reject | cancel | revise`
`GET /proposals/{id}/pdf` → `application/pdf`, `Content-Disposition: inline; filename="Proposta-AAAA-NNNN.pdf"`. Disponível em qualquer status (`draft` leva marca d'água "RASCUNHO").
`POST /proposals/preview-totals` → totais calculados sem persistir (usado pelo formulário para espelhar RN-10 sem duplicar lógica no frontend).

### Timeline
`GET /contacts/{id}/timeline`, `GET /companies/{id}/timeline` (agrega `events.company_id`), `GET /opportunities/{id}/timeline` — filtros `type`, paginação por cursor `before=<occurred_at,id>` (padrão 30). Resposta: itens unificados `{kind: "event"|"activity", occurred_at, type, description, user:{id,name}, metadata, activity?: {…}}` — o service faz *merge* ordenado de `events` e de atividades **pendentes futuras** (exibidas em seção "Próximas" separada, não misturadas ao histórico).

### Search
`GET /search?q=&limit=5` (q ≥ 2 caracteres) → `{companies:[], contacts:[], opportunities:[], proposals:[]}` com no máximo `limit` por tipo; ordena por similaridade (`pg_trgm`) e depois recência. Para "Empresa XYZ": retorna a empresa e, por vínculo, seus contatos/oportunidades/propostas quando o nome da empresa casar (JOIN por `company_id`).

### Settings / Health
`GET /settings` (todos; sem campos sensíveis), `PUT /settings` (Admin), `GET|PUT /settings/logo`. `GET /health` → `{status, db: ok|fail, version}` sem autenticação; `GET /health/ready` verifica migrations aplicadas.

## 7.4 Schemas de exemplo (Pydantic)

```python
class ContactCreate(BaseModel):
    first_name: constr(min_length=1, max_length=100)
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None; mobile: str | None = None; job_title: str | None = None
    company_id: UUID | None = None
    origin_id: UUID | None = None
    owner_id: UUID | None = None            # default = usuário atual
    lifecycle_stage: LifecycleStage = "lead"
    lead_temperature: LeadTemperature | None = None
    notes: str | None = None

class OpportunityMove(BaseModel):
    stage_id: UUID
    probability: Decimal | None = Field(None, ge=0, le=100)
    loss_reason_id: UUID | None = None
    loss_notes: str | None = None
```
Campos monetários em saída: `Annotated[Decimal, PlainSerializer(str)]`.

---

# 8. Eventos

## 8.1 Estrutura (`core/events.py`)

```python
@dataclass
class EventData:
    type: str; entity_type: str; entity_id: UUID
    description: str; user_id: UUID | None
    contact_id: UUID | None = None; company_id: UUID | None = None; opportunity_id: UUID | None = None
    metadata: dict = field(default_factory=dict)
```
O `publish` preenche automaticamente `contact_id/company_id/opportunity_id` a partir da entidade quando possível (uma proposta ⇒ sua oportunidade/contato/empresa).

## 8.2 Catálogo de tipos

| Tipo | Entidade principal | Descrição (modelo) | Metadata |
|---|---|---|---|
| `contact_created` / `company_created` | contact/company | "Lead criado" / "Contato criado" / "Empresa criada" | `{lifecycle_stage}` |
| `contact_updated` / `company_updated` | idem | "Dados atualizados" | `{changed: {campo:{from,to}}}` (sem dados sensíveis) |
| `lead_status_changed` | contact | "Status do lead: Em contato → Qualificando" | `{from,to}` |
| `lead_disqualified` / `lead_reactivated` | contact | "Lead desqualificado: {motivo}" | `{reason}` |
| `lead_converted` | contact | "Lead convertido em Prospect" | |
| `customer_converted` | contact | "Convertido em Cliente" | `{trigger, opportunity_id?}` |
| `lifecycle_reverted` | contact | "Ciclo de vida revertido para X" | `{reason}` |
| `company_stage_changed` | company | | `{from,to}` |
| `opportunity_created` | opportunity | "Oportunidade criada" | `{amount}` |
| `opportunity_updated` | opportunity | | `{changed}` |
| `opportunity_stage_changed` | opportunity | 'Oportunidade alterada para "Proposta"' | `{from,to,from_name,to_name}` |
| `opportunity_reopened` / `opportunity_deleted` | opportunity | | |
| `activity_created` / `activity_completed` / `activity_canceled` | activity (vinculado a contato/opp.) | "Ligação registrada", "Reunião concluída"… | `{activity_id, type}` |
| `proposal_created/sent/accepted/rejected/canceled/revised` | proposal | "Proposta 2026-0001 enviada" | `{number, total}` |
| `user_login` / `user_login_failed` | — | auditoria apenas (não aparece em timelines: `contact_id/company_id/opportunity_id` nulos) | `{ip}` |
| `user_created/deactivated/password_reset` | user | auditoria | |

Eventos de usuário/segurança e de configurações são consultáveis apenas por Admin (`GET /audit?type=&user_id=&from=&to=` — paginado).

---

# 9. Geração de PDF

`integrations/pdf/renderer.py`: `render_proposal(proposal, settings) -> bytes` via Jinja2 + WeasyPrint.

**Layout (A4 retrato):** cabeçalho com logo e dados do emissor (`system_settings`); título "Proposta Comercial nº AAAA-NNNN"; bloco Cliente/Contato/Responsável/Datas; tabela de itens (nº, descrição, un., qtd, unit., desc., total); bloco de totais (subtotal, descontos, **total**); condições (prazo, pagamento, validade); observações; rodapé configurável + paginação "Página x de y". Marca d'água "RASCUNHO" quando `draft`, "CANCELADA" quando `canceled`.

**Regras:** valores formatados `R$ 1.234,56` (locale pt-BR, `babel`); datas `dd/mm/aaaa`; quantidades sem zeros à direita desnecessários; quebra de página sem separar linha de item; fontes **Inter embarcada** (mesma do Vision.AI, offline); texto escapado (autoescape Jinja ON — proteção contra injeção de HTML vinda de descrições); logo validado (PNG/JPEG/SVG sanitizado, ≤512 KB). O PDF usa os mesmos tokens de cor do Vision.AI (acento `#EC3013` usado com moderação; documento legível em P&B).
**Consistência:** o PDF usa **os valores persistidos** (`subtotal/discount_total/total`), nunca recalcula; teste automatizado compara total do PDF (via extração de texto) com `proposal.total`.

---

# 10. Dashboard, Tags, E-mail, Cadências (P1 — contratos)

Mantidos aqui apenas para garantir que o MVP não os bloqueie.

* **Dashboard** `GET /dashboard/summary?owner_id=&from=&to=` → `{leads, prospects, customers, open_opportunities, pipeline_amount, weighted_pipeline_amount, proposals_sent, proposals_accepted, followups_pending, followups_overdue}`. Todos derivados por `COUNT/SUM` de índices existentes; **nenhuma tabela nova no MVP é necessária**.
* **Tags:** `tags(id, name UNIQUE citext, color)` + `entity_tags(tag_id, entity_type, entity_id)`; filtro `?tag_id=` nas listagens.
* **E-mail/Cadências/Scheduler:** serviço `scheduler` consome `scheduled_jobs` com `SELECT … FOR UPDATE SKIP LOCKED`, idempotência por `job_key`, retentativas com backoff exponencial (3×), registro de falhas. Envio SMTP em `integrations/smtp.py`. Corpo HTML sanitizado (allow-list). Credenciais SMTP via env no MVP-P1; cifradas (Fernet com `APP_ENCRYPTION_KEY`) se salvas por usuário.
* Gancho já presente no MVP: `events` + handlers pós-commit.

---

# 11. Frontend

## 11.1 Stack e estrutura

Vue 3.5 + TypeScript (strict) + Vite 7, Pinia (sem persistência de token), Vue Router, vue-i18n (pt-BR padrão, `en` stub), Tailwind 3 apontando para tokens CSS, `lucide-vue-next`, axios, `@vueuse/core`. Testes: Vitest + @vue/test-utils; E2E: Playwright.

```text
frontend/src/
├── main.ts  App.vue
├── styles/{tokens.css, base.css}           # tokens copiados do vision_hub (seção 14)
├── router/index.ts                          # guards: auth, role, must_change_password
├── layouts/{AppLayout.vue, AuthLayout.vue}
├── services/{http.ts, auth.ts, contacts.ts, companies.ts, opportunities.ts, activities.ts, proposals.ts, products.ts, pipeline.ts, search.ts, …}
├── stores/{auth.ts, ui.ts, pipeline.ts, lookups.ts}
├── composables/{useListQuery.ts, useConfirm.ts, usePermissions.ts, useMoney.ts, useDebounce.ts}
├── types/{api.ts, entities.ts}              # espelha schemas; moeda como string
├── components/{ui/…, domain/…}
└── views/…
```

**`http.ts`:** axios com `baseURL = /api/v1`, `withCredentials`; interceptor injeta `Authorization` do store; em `401 TOKEN_EXPIRED` faz **um** refresh (fila única de requisições em espera) e repete; falha no refresh ⇒ logout + redirect `/login?next=`. Desembrulha o envelope e normaliza erros em `ApiError {code, message, details}`.

## 11.2 Rotas

| Rota | View | Observação |
|---|---|---|
| `/login`, `/change-password` | Auth | |
| `/` | Home | MVP: "Minhas tarefas/follow-ups" (resumo + lista); P1: Dashboard |
| `/leads`, `/prospects`, `/customers` | `ContactListView` (prop `stage`) | colunas/ações por estágio |
| `/contacts`, `/contacts/:id` | lista / `ContactDetailView` | |
| `/companies`, `/companies/:id` | | |
| `/pipeline` | `PipelineBoardView` | Kanban |
| `/opportunities`, `/opportunities/:id` | lista / detalhe | |
| `/proposals`, `/proposals/new?opportunityId=`, `/proposals/:id`, `/proposals/:id/edit` | | |
| `/activities` | Tarefas e follow-ups | filtros; atalho "Atrasadas" |
| `/products` | Catálogo | |
| `/settings/{profile,users,pipeline,lists,system}` | Configurações | `users/pipeline/lists/system` exigem Admin |
| `/forbidden`, `*` | 403 / 404 | |

Itens de menu P1 não são renderizados (feature flags em `config/features.ts`).

## 11.3 Telas e comportamento (resumo normativo)

* **Listagens:** barra de filtros (persistidos na query string), busca com debounce 300 ms, paginação server-side (`VPaginador`), ordenação por coluna, estados vazio/carregando/erro. Linha clicável abre detalhe. Ação rápida "Nova atividade".
* **Lead (lista):** colunas Nome, Empresa, Origem, Temperatura, Status, Última interação, Próxima ação (vermelho + texto "Atrasada" se vencida), Responsável. Ação "Converter em Prospect" habilitada só se `qualified`.
* **Detalhe (Contato/Empresa/Oportunidade):** cabeçalho (nome, badges de estágio/status, ação principal contextual), abas **Dados · Oportunidades · Atividades · Propostas · Histórico**. Aba Histórico = timeline (seção 7.3) com seção "Próximas atividades" e carregamento incremental. "Registrar atividade" abre modal rápido (tipo, título, data/hora, prioridade; opção "já realizada").
* **Conversão:** modal de confirmação mostrando efeito; "Converter em Prospect" oferece checkbox "Criar oportunidade agora" com mini-form. Ao tentar criar oportunidade para lead (`CONTACT_IS_LEAD`) mostra o diálogo de conversão e retoma.
* **Kanban:** colunas = estágios ativos; cartão: nome, empresa, valor (BRL), responsável (iniciais), previsão (vermelho + texto se vencida e aberta), probabilidade. Cabeçalho da coluna: contagem e total. **Drag & drop** com HTML5 DnD/`@vueuse` (ou `vuedraggable` se aprovado), **atualização otimista com rollback** em erro. Soltar em "Perdido" abre modal de motivo (obrigatório); em "Ganho" confirma e informa conversão em Cliente. Fallback acessível: menu "Mover para…" no cartão (teclado/touch). Filtros: responsável, busca. Scroll por coluna com "carregar mais".
* **Proposta (form):** cabeçalho; tabela de itens editável (seletor de produto com busca → preenche descrição/un./preço; item avulso permitido); desconto por item e global com alternância `R$/%`; totais **vindos de `POST /proposals/preview-totals`** (debounce 300 ms) — o frontend não reimplementa a regra. Salvar rascunho; ações conforme status (Enviar / Aceitar / Recusar / Cancelar / Revisar / Baixar PDF). Após `send`/`accept` exibir sugestão de mover oportunidade (botão de confirmação).
* **Moeda/datas:** `useMoney` formata strings decimais; entrada com máscara e conversão para string `"1234.50"`; datas pelo `DEFAULT_TIMEZONE`.
* **Erros:** toasts (`VToasts`) para erros globais; `details[]` mapeados aos campos do formulário; `409 VERSION_CONFLICT` ⇒ aviso "registro alterado por outra pessoa" + recarregar.
* **Confirmação** em ações destrutivas (excluir, cancelar proposta, perder oportunidade) via `useConfirm`.

## 11.4 Acessibilidade e responsividade
Desktop-first; funcional ≥ 768 px (tablet) e utilizável em notebook; Kanban com rolagem horizontal. Estado/severidade **nunca só por cor** (sempre texto/ícone). Foco visível, navegação por teclado, `aria-label` em botões de ícone, contraste AA. Dark/light via `data-theme` (preferência do SO + toggle persistido em `localStorage`).

---

# 12. Requisitos Transversais

## 12.1 Logging
`structlog` (ou `logging` + JSON formatter) → stdout em JSON: `timestamp, level, service, request_id, user_id, method, path, status, duration_ms, error?`. Middleware gera/propaga `X-Request-ID`. **Nunca** logar senha, tokens, corpo completo de requisições de auth ou dados de contato além de IDs. Nível por `LOG_LEVEL`. Erros 5xx incluem stack **apenas no log**.

## 12.2 Segurança
Headers (via nginx): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`, CSP restritiva (`default-src 'self'`; estilos/fontes locais — sem CDN; compatível com instalação offline). XSS: Vue escapa por padrão; `v-html` **proibido** (regra ESLint `vue/no-v-html: error`). SQL: apenas ORM/parâmetros. Validação: Pydantic em toda entrada, limites de tamanho (`MAX_BODY_BYTES` 2 MB; logo 512 KB). Upload do logo: validar magic bytes, não confiar no `Content-Type`. Segredos só por env; `.env` no `.gitignore`; imagens sem segredos embutidos. Dependências fixadas (lock) e `pip-audit`/`npm audit` no CI.

## 12.3 LGPD
`POST /contacts/{id}/anonymize` (Admin): substitui nome por "Contato anonimizado", limpa e-mail/telefones/cargo/notas, mantém vínculos e valores para integridade comercial, e **sanitiza** `events.description/metadata` do contato (única exceção à imutabilidade; gera evento `contact_anonymized` sem dados pessoais). Exportação de dados de um titular: P1.

## 12.4 Performance
Metas do PRD §11 com 50 mil contatos / 10 mil oportunidades. Garantias de implementação: toda listagem paginada com índice de apoio (seção 4.2); `EXPLAIN` revisado nas 6 consultas mais críticas (lista de contatos com filtros, board, timeline, atividades pendentes, busca, proposals list); evitar N+1 com `selectinload/joinedload`; board com limite por coluna; `COUNT` apenas quando `page_size`/`total` solicitado. Script `scripts/seed_demo.py` gera massa (50k/10k) para teste de carga leve (`locust` ou `k6`, 20 usuários) — critério p95.

## 12.5 Observabilidade e operação
`/health`, `/health/ready`; healthcheck do Docker no backend e database; `restart: unless-stopped`; backup: `docker/scripts/backup.sh` (`pg_dump` comprimido com rotação) + `restore.sh` documentados no README.

---

# 13. Infraestrutura

## 13.1 `docker-compose.yml` (produção)

| Serviço | Imagem/Build | Exposição | Observações |
|---|---|---|---|
| `database` | `postgres:16-alpine` | interna | volume `pgdata`; healthcheck `pg_isready`; extensões criadas na migration inicial |
| `backend` | `backend/Dockerfile` (python:3.12-slim + libs do WeasyPrint: pango/cairo/fonts) | interna :8000 | `entrypoint.sh`: aguarda DB → `alembic upgrade head` → `python -m app.seed` (idempotente) → `uvicorn app.main:app --workers ${WEB_CONCURRENCY:-2}`; roda como usuário não-root |
| `frontend` | multi-stage (node build → nginx) | interna :80 | |
| `proxy` | `nginx:alpine` | `${HTTP_PORT:-8080}:80` | roteia `/api/` → backend, resto → frontend; headers de segurança; `client_max_body_size 2m` |
| (P1) `scheduler` | mesma imagem do backend, `command: python -m app.workers.scheduler` | — | |

`docker-compose.dev.yml` (override): volumes de código, `uvicorn --reload`, Vite dev server :5173 com proxy `/api → backend`, DB publicado em 5432, `CORS_ORIGINS=http://localhost:5173`.
Comandos: `docker compose up -d` (prod) · `docker compose -f docker-compose.yml -f docker-compose.dev.yml up` (dev).

## 13.2 `.env.example` (completo)

```env
APP_ENV=development                # development | production
LOG_LEVEL=INFO
HTTP_PORT=8080
WEB_CONCURRENCY=2

POSTGRES_USER=minicrm
POSTGRES_PASSWORD=change-me
POSTGRES_DB=minicrm
DATABASE_URL=postgresql+psycopg://minicrm:change-me@database:5432/minicrm

JWT_SECRET=                        # >= 32 chars aleatórios; obrigatório em production
JWT_ACCESS_TTL_MINUTES=15
JWT_REFRESH_TTL_DAYS=7
COOKIE_SECURE=false                # true atrás de HTTPS
CORS_ORIGINS=                      # vazio em production (mesma origem)

DEFAULT_TIMEZONE=America/Sao_Paulo
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=                    # obrigatório no primeiro start

# P1
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
APP_ENCRYPTION_KEY=
AI_ENABLED=false
AI_API_URL=
```
`core/config.py` usa `pydantic-settings`; falha na inicialização (mensagem clara) se variável obrigatória faltar para o `APP_ENV`.

---

# 14. Inventário de Reaproveitamento (Q-03)

Referências verificadas em disco. Regra: **copiar e adaptar**, nunca importar entre projetos.

| Origem | Aproveitar | Como |
|---|---|---|
| `vision.ai/vision_hub/src/styles/tokens.css` | Tokens `--v-*` (cores/acento `#EC3013`/neutros, raios 2-4-8-12, sombras, espaçamento `--v-space-*`, tipografia Inter, tema `[data-theme='dark']`) | Copiar para `frontend/src/styles/tokens.css`; manter prefixo `--v-` ou renomear para `--m-` em ponto único; embarcar `public/fonts/inter-*.woff2` |
| `vision_hub/tailwind.config.js`, `postcss.config.js`, `vite.config.ts`, `tsconfig.json` | Config Tailwind apontando aos tokens, build, TS | Copiar e adaptar (conferir se mantém `borderRadius`/`boxShadow` zerados — decidir com base nos tokens: o Vision.AI v. atual usa raio 2–12 px e sombra suave) |
| `vision_hub/src/components`: `VModal`, `VTabs`, `VToasts`, `VPaginador`, `VIconButton`, `VFieldHint`, `AppLayout` | Primitivas de UI | Copiar para `components/ui/`, remover dependências de domínio de vídeo |
| `vision_hub/scripts/check-design.mjs` (`lint:design`) | Lint de design (impede cores/valores fora dos tokens) | Adaptar e rodar no `npm run build` |
| `vision_hub` `package.json` | Versões de Vue/Vite/Pinia/i18n/lucide/axios | Usar as mesmas versões |
| `vision.ai/requirements.txt` | Versões FastAPI/SQLAlchemy/Pydantic/PyJWT | Alinhar (FastAPI 0.118, SQLAlchemy 2.0.44, Pydantic 2.12) |
| `pro-ai-assistant/pro_ai_api` (`config.py`, `library/{password,token,rate_limit,cors,reset_link}.py`, `run_migrations.py`, `entrypoint.sh`, `alembic.ini`, `migrations/`) | Padrões de configuração, hash/JWT, rate limit, CORS, execução de migrations no start | Portar a lógica para `core/` (a API de referência é **Flask**; o MINI-CRM é **FastAPI** — portar conceito, não código de framework) |
| `pro-ai-assistant/pro_ai_scheduler` | Estrutura APScheduler (`registry`, `runner`) | Base do `workers/scheduler` no P1 |
| `pro-ai-assistant/deploy/nginx/nginx.conf`, `deploy/` | Proxy `/api/` + frontend estático | Adaptar para compose simples (o projeto de referência usa Docker Swarm; o MINI-CRM usa **Compose**, conforme PRD) |
| `pro-ai-assistant/CLAUDE.md` | Estilo de documentação para agentes | Criar `CLAUDE.md` no mini-crm com comandos e convenções após scaffold |

**Não reaproveitar:** MongoDB, Qdrant, Ollama, MCP, Swarm, App Builder, componentes de vídeo/câmera/regras do Vision.AI.

---

# 15. Estratégia de Testes

| Camada | Ferramenta | Escopo mínimo |
|---|---|---|
| Unit (domain) | pytest | `proposal_calc` (tabela de verdade 5.3), máquinas de estado de proposta e `lead_status`, lifecycle, validação de CNPJ |
| Services (integração com DB real) | pytest + PostgreSQL via `testcontainers` ou serviço do CI; transação revertida por teste | Conversões (RN-02/05/06), `move` (probabilidade, motivo de perda, reabertura, conversão automática), derivação do estágio da empresa, regras de exclusão, atomicidade alteração+evento (forçar falha após `publish` e verificar rollback), imutabilidade de `events` |
| API | pytest + httpx `AsyncClient` | Cada endpoint: sucesso, 401, 403 (matriz 6.2), 404, validação 422, conflitos 409; envelope; paginação/filtros/ordenação; `If-Match`; refresh rotativo e detecção de reuso |
| PDF | pytest | Gera bytes `%PDF`, extrai texto e confere número/total/itens; marca d'água em `draft` |
| Frontend | Vitest | `useMoney`, `http.ts` (fila de refresh), formulário de proposta (usa preview-totals), Kanban (otimista + rollback), guards de rota |
| E2E | Playwright (1 fluxo principal) | Login → criar empresa/contato/lead → qualificar → converter → criar oportunidade → mover até Proposta → criar proposta → enviar → baixar PDF → aceitar → mover para Ganho → contato vira Cliente → timeline contém todos os eventos |
| Carga leve | k6/locust | p95 das 6 consultas críticas com massa 50k/10k |
| Segurança | `pip-audit`, `npm audit`, teste de que nenhum endpoint (exceto whitelist) responde sem token (varredura automática das rotas do OpenAPI) | |

Cobertura: ≥ 80% em `services/` e `domain/` (gate no CI). **CI** (GitHub Actions ou equivalente): lint (ruff, eslint, vue-tsc, `lint:design`), testes backend + frontend, build das imagens, `docker compose up` de fumaça com `/health`.

---

# 16. Plano de Implementação (MVP)

Cada marco entrega algo executável e testado. Estimativas relativas (S ≤ 1 d, M ≈ 2-3 d, L ≈ 4-5 d).

| # | Marco | Entregas | RF/RN | Tam. |
|---|---|---|---|---|
| M0 | **Scaffold & infra** | Estrutura de pastas, Docker/Compose (prod+dev), `.env.example`, `core/{config,db,logging,errors}`, Alembic + migration inicial (extensões), `/health`, CI, frontend base (tokens, layout, router, http, i18n), README, `CLAUDE.md` | — | M |
| M1 | **Auth & usuários** | `users`, `refresh_tokens`, login/refresh/logout, change/reset password, lockout/rate-limit, seed admin, policies, tela de login/usuários/perfil, guards | RF-01..05, RN-17 | L |
| M2 | **Eventos & timeline (base)** | `events`, `core/events.publish`, endpoint de timeline, componente `Timeline`, testes de atomicidade | RF-45, RN-14 | M |
| M3 | **Empresas & contatos** | CRUD, CNPJ, duplicidades, origens, status do lead, derivação de estágio da empresa, listas Lead/Prospect/Cliente, detalhes com abas | RF-10..12, 20..22, 25, 26, RN-01/03/13 | L |
| M4 | **Conversões** | `convert_to_prospect/customer`, disqualify/reactivate, modais, eventos | RF-23, 24, RN-02, 05, 06 | M |
| M5 | **Pipeline & oportunidades** | `pipeline_stages` + admin, CRUD de oportunidades, `move`, histórico de estágios, motivos de perda, reabertura, board Kanban, `version`/`If-Match` | RF-30..36, RN-04, 07, 08 | L |
| M6 | **Atividades & follow-ups** | CRUD, complete/cancel, herança de vínculos, `last_interaction_at`, próxima ação, atrasadas, tela "Tarefas e follow-ups", Home, modal rápido | RF-40..44, RN-15 | M |
| M7 | **Catálogo & propostas** | `products`, `proposals/items`, numeração, cálculo, máquina de estados, revisão, preview-totals, formulário, sugestões RN-09 | RF-50, 60..66, 68, 69, RN-09..11 | L |
| M8 | **PDF** | Renderer, template, settings do emissor + logo, marca d'água, testes de consistência | RF-67 | M |
| M9 | **Busca simples & configurações** | `/search` + caixa global, tela Sistema/Listas, `GET /audit` (Admin) | Q-11 | S |
| M10 | **Hardening & aceite** | E2E principal, massa 50k/10k + verificação de p95, revisão de segurança (headers/CSP, varredura de rotas sem auth), anonimização LGPD, backup/restore, README final, checklist de aceite (seção 17) | PRD §11, §17 | M |

Dependências: M0 → M1 → M2 → M3 → M4 → M5 → (M6, M7 em paralelo) → M8 → M9 → M10. M2 antecede M3 porque todos os serviços seguintes publicam eventos.

---

# 17. Matriz de Aceite → Verificação

Cada critério do PRD §17 mapeia para teste automatizado (nome sugerido) e/ou verificação manual.

| Critério do PRD | Verificação |
|---|---|
| Cadastrar empresa; CNPJ inválido/duplicado rejeitado | `api/test_companies::test_create_invalid_cnpj_422`, `::test_duplicate_cnpj_409` |
| Cadastrar contato vinculado à empresa | `api/test_contacts::test_create_with_company` |
| Lead até `Qualificado`; conversão bloqueada sem `Qualificado` | `services/test_lifecycle::test_convert_requires_qualified` |
| Lead → Prospect; Prospect → Cliente (manual e por oportunidade ganha) | `services/test_lifecycle::test_to_customer_manual`, `services/test_opportunity::test_won_converts_customer` |
| Timeline completa inclusive pré-conversão | `services/test_timeline::test_history_preserved_after_conversion` + E2E |
| Oportunidade bloqueada para lead puro | `services/test_opportunity::test_create_for_lead_returns_409` |
| Mover no Kanban e formulário; probabilidade acompanha | `services/test_opportunity::test_move_updates_probability`; Vitest `kanban.spec` |
| Perdida exige motivo; ganha converte | `::test_lost_requires_reason`, `::test_won_converts_customer` |
| Valor/previsão; totais por coluna | `api/test_pipeline::test_board_totals` |
| Tarefa/ligação/reunião/follow-up; atrasados destacados; pendentes por responsável | `api/test_activities::*` (overdue calculado), Vitest de badge "Atrasada" |
| Proposta: itens, subtotal, desconto, total (RN-10) | `unit/test_proposal_calc` (tabela 5.3) |
| Status conforme RF-65; enviada somente leitura; revisar cria nova | `unit/test_proposal_status`, `api/test_proposals::test_locked_after_send`, `::test_revise_creates_new` |
| PDF consistente com a tela | `integration/test_pdf::test_pdf_total_matches` |
| 401 sem token / 403 vendedor em recurso Admin | varredura OpenAPI + `api/test_permissions` |
| Docker a partir do `.env.example`, migrations, API, OpenAPI, frontend | CI de fumaça + checklist manual M10 |
| Métricas de sucesso (PRD §2.3) | Cadastro de lead < 30 s: teste de usabilidade manual; ambiente < 10 min: cronometrado em máquina limpa |

---

# 18. Riscos e Pontos de Atenção

| Risco | Mitigação |
|---|---|
| WeasyPrint exige libs nativas (pango/cairo) — falha em imagem slim/Windows | Dependências instaladas no Dockerfile; desenvolvimento via Docker; fallback documentado (Playwright/Chromium headless) se houver problema de fidelidade |
| Referência `pro-ai-assistant` usa Flask/Swarm (divergente de FastAPI/Compose) | Portar conceitos (seção 14), não código de framework |
| Derivação do estágio da empresa pode ficar inconsistente | Função única `recompute_company_stage` chamada em todos os pontos listados + teste de propriedade (sequências aleatórias de operações) |
| Drag & drop com atualização otimista gera estado divergente em falha/concorrência | Rollback visual, `If-Match`, refetch da coluna em `409` |
| Eventos denormalizados (`contact_id/company_id/opportunity_id`) podem não refletir mudança de vínculo | Eventos são **registros históricos**: refletem o vínculo no momento. Ao mudar `company_id` de um contato, a timeline da empresa antiga mantém eventos antigos (comportamento documentado e aceito) |
| Escopo (L em vários marcos) | Itens cortáveis sem quebrar aceite: Agenda calendário, reversão manual de lifecycle, `GET /audit`, anonimização (mover para P1 se necessário), alternância `%` de desconto |

---

# 19. Pendências para Confirmação

Apenas o que ainda **não** está coberto pelas decisões da seção 1:

1. Confirmar **`If-Match`/`version`** (seção 3) — aumenta robustez, mas exige envio do header pelo frontend em `PATCH/PUT/move`. Alternativa: last-write-wins no MVP.
2. Confirmar **PDF síncrono** (seção 2.1) e WeasyPrint como biblioteca.
3. Confirmar **refresh token em cookie `HttpOnly`** (exige HTTPS em produção: `COOKIE_SECURE=true`) em vez de token só em memória/localStorage.
4. Confirmar nome do prefixo de tokens CSS (`--v-` herdado do Vision.AI vs. `--m-` próprio).
5. Confirmar a política de **LGPD no MVP** (anonimização) ou adiamento para P1.

---

# Fim da SPEC
