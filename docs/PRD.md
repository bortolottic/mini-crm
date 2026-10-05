# PRD — MINI-CRM

**Versão:** 1.1
**Status:** Revisado — pronto para derivar a SPEC (após resolver as Questões em Aberto, seção 19)
**Produto:** MINI-CRM
**Tipo:** CRM Web B2B
**Objetivo:** Gestão simplificada de Leads, Prospects, Clientes e Oportunidades

> **Histórico de revisão**
> * 1.0 — Draft inicial.
> * 1.1 — Modelo de dados unificado (ciclo de vida), regras de negócio explícitas, IDs de requisito, MVP/P1/P2 consistentes, decisões técnicas propostas, requisitos não funcionais mensuráveis e questões em aberto. O conteúdo de visão, roadmap e IA foi preservado, porém condensado.

---

# 1. Visão do Produto

O **MINI-CRM** é uma aplicação web de CRM compacta, moderna e modular para gerenciar o ciclo comercial de empresas. Acompanha um contato desde a entrada como **Lead**, passando pela qualificação como **Prospect**, até a conversão em **Cliente**, mantendo todo o histórico de relacionamento.

Prioridades: simplicidade, velocidade de uso, baixa complexidade operacional, interface moderna, facilidade de manutenção, arquitetura modular, execução local/on-premise/cloud e preparação para IA e automações.

A primeira versão evita a complexidade dos CRMs tradicionais e se concentra no núcleo da operação comercial.

---

# 2. Objetivos

## 2.1 Objetivo principal

Controlar o processo comercial de ponta a ponta:

```text
Lead → Qualificação → Prospect → Oportunidade → Proposta → Negociação → Cliente → Pós-venda
```

## 2.2 Objetivos específicos

* Centralizar informações comerciais e eliminar planilhas dispersas.
* Acompanhar oportunidades em pipeline visual.
* Registrar interações e controlar follow-ups.
* Criar propostas comerciais e gerar PDF.
* Manter histórico completo e imutável do relacionamento.
* (P1) Enviar e-mails e executar cadências.
* Manter arquitetura preparada para IA e automações por eventos.

## 2.3 Métricas de sucesso do MVP

| Métrica | Meta |
|---|---|
| Tempo para cadastrar Lead (formulário mínimo) | < 30 s |
| Tempo para subir ambiente do zero (`docker compose up`) | < 10 min |
| Fluxo completo Lead → Cliente executável sem sair do sistema | 100% dos critérios da seção 17 |
| Planilhas externas necessárias para operar o funil | 0 |

---

# 3. Não Objetivos — MVP

Fora do escopo inicial: ERP, faturamento, emissão fiscal, gestão financeira, ticketing, marketing automation, campanhas massivas de e-mail, telefonia/VoIP, WhatsApp oficial, gestão avançada de contratos, BI corporativo, previsão financeira avançada, Machine Learning próprio, **multi-tenant ativo**, **importação/exportação em massa** (ver Q-07), **tracking de visualização de proposta** e **assinatura eletrônica**.

Esses recursos poderão ser adicionados por módulos.

---

# 4. Público-alvo e Perfis

PMEs, equipes comerciais, consultorias, empresas de serviços e tecnologia, representantes comerciais e equipes de pré-vendas/vendas. Funciona para usuário individual ou pequenas equipes.

| Perfil | Permissões no MVP |
|---|---|
| **Admin** | Tudo: usuários, configurações, catálogo, pipeline, dados de todos os usuários. |
| **Vendedor** | CRUD sobre registros; vê todos os registros da equipe (ver Q-05); não gerencia usuários nem configurações. |

Modelo de permissões deliberadamente simples; estrutura preparada para papéis adicionais.

---

# 5. Decisões Técnicas

Itens marcados **(proposto)** são recomendações para fechar na SPEC; os demais são requisitos.

## 5.1 Backend

* **Python**, arquitetura em camadas:

```text
API (routers)  →  Services (regras de negócio)  →  Repositories  →  Database
                         │
                    Domain (entidades, regras puras, eventos)
```

* Camadas obrigatórias: API, services, repositories, integrações, workers. Termos "BPO" e "DAO" do rascunho anterior foram unificados em **Services** e **Repositories**.
* Framework web: **FastAPI (proposto)**.
* ORM/migrations: **SQLAlchemy 2 + Alembic (proposto)**.
* Banco: **PostgreSQL (proposto)**; SQLite apenas para testes rápidos, se não gerar divergência de comportamento.
* Autenticação: **JWT de acesso curto + refresh token (proposto)**, senhas com argon2/bcrypt.
* Geração de PDF no backend: **WeasyPrint ou equivalente (proposto)**, via template HTML.
* Valores monetários: `Decimal`/`NUMERIC(14,2)`, nunca float.

## 5.2 Frontend

**Vue 3 + TypeScript**, Composition API, componentes reutilizáveis, estado global só quando necessário (**Pinia, proposto**), cliente REST tipado, formulários tipados com validação, build com **Vite (proposto)**.

## 5.3 Referências externas

| Referência | Uso | Observação |
|---|---|---|
| `D:\projects\personal\vision.ai` | Identidade visual: paleta, tipografia, espaçamentos, componentes, ícones, navegação, responsividade, dark/light. | Manter linguagem visual consistente; não copiar telas. |
| `D:\projects\projjetta\pro-ai-assistant` | Estrutura de backend, config, Docker, env, auth, migrations, logging, tratamento de erros. | Reutilizar padrões, **sem acoplamento** entre projetos (copiar/adaptar, não importar). |

> A SPEC deve inventariar concretamente o que será aproveitado de cada referência (tokens de design, estrutura de pastas, middlewares). Ambos os caminhos são externos ao repositório e precisam estar acessíveis a quem gerar a SPEC.

## 5.4 Infraestrutura

Distribuição via Docker; todos os componentes executáveis em containers.

```text
docker-compose.yml:  frontend | backend | database | (P1) worker | (P1) scheduler
```

Execução suportada em: local (Windows/Linux/macOS), servidor próprio (Linux + Docker) e cloud (Azure/AWS/GCP). Sem dependência obrigatória de SaaS externo.

Arquitetura geral:

```text
Browser (Vue 3 + TS) ── REST/HTTP ── Backend (Python) ──┬── Database
                                                        ├── Email service (P1)
                                                        └── AI service (futuro, opcional)
```

---

# 6. Glossário e Modelo Conceitual

| Termo | Definição |
|---|---|
| **Empresa** | Organização (conta). Pode ter vários contatos. |
| **Contato** | Pessoa física, opcionalmente vinculada a uma empresa. |
| **Estágio de ciclo de vida** (`lifecycle_stage`) | `lead`, `prospect` ou `customer`. É um **atributo** do Contato (e da Empresa), não uma entidade separada. |
| **Lead** | Contato ainda não qualificado (`lifecycle_stage = lead`). |
| **Prospect** | Contato qualificado, com potencial real de compra (`prospect`). |
| **Cliente** | Contato/empresa com ao menos uma oportunidade ganha (`customer`). |
| **Oportunidade** | Negociação concreta com valor, estágio no pipeline e previsão de fechamento. |
| **Atividade** | Interação ou tarefa agendável (ligação, reunião, tarefa, nota, follow-up…). |
| **Evento** | Registro imutável de algo que ocorreu (alimenta timeline, auditoria e futura IA). |
| **Proposta** | Documento comercial com itens e condições, vinculado a uma oportunidade. |

## 6.1 Decisão de modelagem (alteração relevante vs. v1.0)

A v1.0 tratava Lead, Prospect e Cliente como entidades distintas (e listava só `leads` no banco). Isso obrigaria copiar/migrar histórico a cada conversão. **Na v1.1, Lead/Prospect/Cliente são estágios de ciclo de vida do Contato (e da Empresa)**:

* "Converter" = mudar `lifecycle_stage` + registrar evento. Histórico, atividades, e-mails e propostas já ficam vinculados ao mesmo registro, **sem perda por construção**.
* As telas "Leads", "Prospects" e "Clientes" são **visões filtradas** da mesma base.
* Atributos de qualificação (origem, temperatura, status do lead) pertencem ao Contato e são relevantes enquanto `lifecycle_stage = lead`.

```text
Empresa 1───N Contato 1───N Oportunidade 1───N Proposta 1───N Item
                │                 │
                └──N Atividade ───┘            Todos geram ──► Evento (timeline/auditoria)
Empresa 1───N Oportunidade
Produto 1───N Item de Proposta
Tag N───N (Empresa | Contato | Oportunidade)
```

---

# 7. Requisitos Funcionais

Cada requisito possui ID (`RF-nn`) e prioridade (P0 = MVP, P1 = segunda etapa, P2 = evolução) para rastreabilidade na SPEC.

## 7.1 Autenticação e Usuários

| ID | Requisito | Prio |
|---|---|---|
| RF-01 | Login, logout e sessão autenticada (token com expiração). | P0 |
| RF-02 | Alteração de senha pelo próprio usuário. | P0 |
| RF-03 | Recuperação de senha. No MVP sem e-mail configurado: redefinição pelo Admin; por e-mail a partir do P1. | P0/P1 |
| RF-04 | CRUD de usuários pelo Admin; usuário ativo/inativo (inativo não autentica, mas preserva histórico). | P0 |
| RF-05 | Dois papéis: Admin e Vendedor. Criação do primeiro Admin via seed/variável de ambiente. | P0 |

## 7.2 Empresas

| ID | Requisito | Prio |
|---|---|---|
| RF-10 | CRUD de empresas. Campos: razão social, nome fantasia, CNPJ (validado, único quando informado), site, e-mail, telefone, endereço, cidade, estado, país, segmento, porte, observações, responsável, `lifecycle_stage`. | P0 |
| RF-11 | Uma empresa possui vários contatos e oportunidades. | P0 |
| RF-12 | Empresa assume `customer` automaticamente na primeira oportunidade ganha (ver RN-05). | P0 |

## 7.3 Contatos, Leads, Prospects e Clientes

| ID | Requisito | Prio |
|---|---|---|
| RF-20 | CRUD de contatos. Campos: nome, sobrenome, e-mail, telefone, celular, cargo, empresa, observações, origem, responsável, `lifecycle_stage`, datas de criação/atualização. Nome é o único campo obrigatório; e-mail único quando informado. | P0 |
| RF-21 | Atributos de lead: origem, temperatura (`frio`/`morno`/`quente`), status de qualificação, última interação (calculada), próxima ação. | P0 |
| RF-22 | Status do lead: `Novo → Em contato → Qualificando → Qualificado`, e terminais `Desqualificado` (com motivo) e `Convertido`. | P0 |
| RF-23 | Converter Lead → Prospect (ação explícita; exige status `Qualificado`). | P0 |
| RF-24 | Converter Prospect → Cliente: automático ao ganhar oportunidade e também manual (RN-05). | P0 |
| RF-25 | Listagens "Leads", "Prospects", "Clientes" como visões filtradas, com busca, filtros e paginação. | P0 |
| RF-26 | Origens configuráveis (lista simples: indicação, site, evento, outbound, outros…). | P0 |

## 7.4 Oportunidades e Pipeline

| ID | Requisito | Prio |
|---|---|---|
| RF-30 | CRUD de oportunidades: nome, empresa, contato, responsável, valor, estágio, probabilidade, previsão de fechamento, origem, observações. | P0 |
| RF-31 | Estágios do pipeline configuráveis pelo Admin (nome, ordem, probabilidade padrão, tipo `aberto`/`ganho`/`perdido`). | P0 |
| RF-32 | Visão Kanban com arrastar entre estágios, valor total por coluna, responsável no card, abertura de detalhes, atalhos para registrar atividade e criar proposta. | P0 |
| RF-33 | Visão em lista com filtros (estágio, responsável, período, faixa de valor). | P0 |
| RF-34 | Mudança de estágio gera evento com estágio anterior/novo e usuário; histórico de estágios é consultável. | P0 |
| RF-35 | Fechamento como **Perdido** exige motivo (lista configurável + texto livre). | P0 |
| RF-36 | Reabrir oportunidade fechada é permitido ao Admin, com evento registrado. | P0 |

**Pipeline padrão (seed):**

| Ordem | Estágio | Tipo | Prob. padrão |
|---|---|---|---|
| 1 | Qualificação | aberto | 10% |
| 2 | Reunião | aberto | 25% |
| 3 | Proposta | aberto | 50% |
| 4 | Negociação | aberto | 75% |
| 5 | Fechado Ganho | ganho | 100% |
| 6 | Fechado Perdido | perdido | 0% |

> Esta é a **única** definição de estágios de oportunidade. Os estágios "Novo" e "Qualificação" da v1.0 pertenciam ao ciclo do Lead e passam a ser o *status do lead* (RF-22), sem duplicidade com o pipeline.

## 7.5 Atividades, Follow-ups e Timeline

| ID | Requisito | Prio |
|---|---|---|
| RF-40 | Atividade com tipo (`ligação`, `reunião`, `tarefa`, `e-mail`, `nota`, `follow-up`, `outro`), título, descrição, responsável, data/hora, prioridade (`baixa`/`média`/`alta`), status (`Pendente`/`Concluída`/`Cancelada`) e entidade relacionada (contato, empresa ou oportunidade). | P0 |
| RF-41 | Follow-up é uma atividade do tipo `follow-up` com data prevista e ação; é a "próxima ação" exibida na entidade (a mais próxima pendente). | P0 |
| RF-42 | Follow-ups/tarefas pendentes com data/hora vencida são destacados como **atrasados** (cálculo em tempo de leitura, sem depender de scheduler). | P0 |
| RF-43 | Concluir atividade atualiza "última interação" da entidade (exceto tipo `tarefa`/`nota`, configurável na SPEC). | P0 |
| RF-44 | Visões "Tarefas/Follow-ups" (lista com filtros) e "Agenda" (calendário simples dia/semana/mês). Agenda pode ser P1 se houver restrição de prazo. | P0 (lista) / P1 (agenda) |
| RF-45 | Timeline por Contato, Empresa e Oportunidade, ordenada por data desc, com paginação; combina atividades e eventos do sistema. A timeline de Empresa agrega a de seus contatos e oportunidades. | P0 |

Eventos de timeline possuem: data/hora, usuário, tipo, descrição, entidade relacionada e metadados opcionais (JSON).

## 7.6 Catálogo

| ID | Requisito | Prio |
|---|---|---|
| RF-50 | CRUD de produtos/serviços: código (único), nome, descrição, categoria, unidade, preço padrão, ativo/inativo. Inativos não aparecem para novas propostas, mas permanecem em propostas existentes. | P0 |

## 7.7 Propostas

| ID | Requisito | Prio |
|---|---|---|
| RF-60 | Proposta vinculada a **uma** oportunidade (que fornece cliente e contato). Uma oportunidade pode ter várias propostas (revisões). | P0 |
| RF-61 | Cabeçalho: número sequencial legível (ex.: `2026-0001`), cliente, contato, oportunidade, data, validade, responsável. | P0 |
| RF-62 | Itens: produto (opcional — permite item avulso), descrição, quantidade, valor unitário, desconto, total do item. Preço do produto é **copiado** para o item (snapshot). | P0 |
| RF-63 | Condições: prazo, forma de pagamento, observações. | P0 |
| RF-64 | Cálculo: ver RN-10. | P0 |
| RF-65 | Estados MVP: `Rascunho → Enviada → Aceita \| Recusada`, além de `Expirada` e `Cancelada`. `Visualizada` fica **reservado** (exige tracking; P2). | P0 |
| RF-66 | Proposta fora de `Rascunho` fica somente leitura; alteração gera nova revisão (nova proposta vinculada à anterior). | P0 |
| RF-67 | Geração de PDF no backend com identidade visual, dados da empresa emissora e do cliente, itens, descontos, total, condições, validade e observações. Dados da empresa emissora são configuráveis (Configurações → Sistema). | P0 |
| RF-68 | Marcar como `Enviada` no MVP é **manual** (registra data e usuário); envio por e-mail integrado vem no P1. | P0 |
| RF-69 | Registrar data/usuário de envio, aceite e recusa. | P0 |

## 7.8 Comunicação (P1)

| ID | Requisito | Prio |
|---|---|---|
| RF-70 | Configurar conta de envio (SMTP); credenciais armazenadas cifradas ou via env. | P1 |
| RF-71 | Enviar e-mail: destinatário, cópia, assunto, corpo HTML (sanitizado), anexos (incl. PDF da proposta). Sempre associado a contato e, se aplicável, oportunidade. Gera atividade `e-mail` e evento. | P1 |
| RF-72 | Templates reutilizáveis com variáveis `{{nome}}`, `{{empresa}}`, `{{email}}`, `{{telefone}}`, `{{oportunidade}}`, `{{valor}}`, `{{usuario}}`; registro de variáveis extensível; variável desconhecida/vazia não deve quebrar o envio (falha de validação visível ao usuário). | P1 |
| RF-73 | Histórico de e-mails enviados com status (`enviado`, `falhou`). | P1 |
| RF-74 | Cadências: nome, descrição, status, etapas (dia relativo, ação: enviar e-mail por template / criar tarefa / criar follow-up). | P1 |
| RF-75 | Inscrição de contato em cadência; cadência é **interrompida** automaticamente se o contato responder (registro manual), for desqualificado ou convertido para cliente (configurável). | P1 |
| RF-76 | Scheduler desacoplado do backend principal (processo/container próprio) executa ações programadas com idempotência e retentativas. | P1 |

## 7.9 Busca, Tags e Dashboard

| ID | Requisito | Prio |
|---|---|---|
| RF-80 | Tags livres aplicáveis a empresas, contatos e oportunidades; filtro por tag nas listagens. | P1 |
| RF-81 | Busca global (empresas, contatos, oportunidades, propostas) por nome/e-mail/CNPJ/número; resultados agrupados por tipo. "Empresa XYZ" retorna a empresa, seus contatos, oportunidades e propostas. | P1 |
| RF-82 | Dashboard: contagem de leads, prospects e clientes; oportunidades abertas; valor do pipeline (soma de valores abertos; valor ponderado como opcional); propostas enviadas e aceitas; follow-ups pendentes e atrasados. Simples, sem configuração. | P1 |

> Tags e busca global simples (por nome) podem ser antecipadas por serem baratas; na SPEC, decidir se entram no MVP.

## 7.10 Automação e IA (P2 — fora do MVP)

* Automação por eventos: `EVENTO → TRIGGER → AÇÃO` (ex.: "Lead criado → adicionar à cadência"; "Proposta enviada → criar follow-up em 3 dias").
* Webhooks e integrações externas.
* IA: lead scoring, resumo de relacionamento, sugestão de próxima ação, geração de e-mail, análise de sentimento.

No MVP implementa-se apenas a **base**: barramento de eventos interno (RN-14) e tabela de eventos com metadados. A camada de IA é um serviço independente e opcional (`AI_ENABLED=false` por padrão); o CRM nunca depende dela.

---

# 8. Regras de Negócio

| ID | Regra |
|---|---|
| RN-01 | Todo registro de ciclo de vida (Contato/Empresa) nasce como `lead`, salvo criação direta informada como `prospect`/`customer` por usuário autorizado. |
| RN-02 | **Lead → Prospect:** permitido apenas com status `Qualificado`. Mantém o mesmo registro; define status do lead como `Convertido`; gera evento `lead_converted`. Pode opcionalmente criar uma oportunidade na mesma ação. |
| RN-03 | Lead `Desqualificado` exige motivo e pode ser reativado (volta a `Novo`), com evento. |
| RN-04 | Oportunidade só pode ser criada para Contato/Empresa em `prospect` ou `customer`. Ao criar oportunidade para um `lead`, o sistema oferece a conversão automática (RN-02). |
| RN-05 | **Prospect → Cliente:** ocorre automaticamente quando uma oportunidade do contato/empresa entra em estágio `ganho`; também pode ser feito manualmente. Gera evento `customer_converted`. Cliente nunca regride automaticamente. |
| RN-06 | Conversões não duplicam nem movem dados; histórico é preservado por construção (mesmo registro). |
| RN-07 | Mover oportunidade atualiza a probabilidade para o padrão do estágio, mas o usuário pode sobrescrevê-la. Estágio `ganho` = 100%, `perdido` = 0%. |
| RN-08 | Estágio `perdido` exige motivo; estágios `ganho`/`perdido` preenchem `closed_at`. |
| RN-09 | Aceitar proposta **não** move a oportunidade automaticamente no MVP; o sistema sugere mover para `Fechado Ganho` (confirmação do usuário). Enviar proposta sugere mover para `Proposta`. |
| RN-10 | **Cálculo de proposta:** `total_item = quantidade × valor_unitário − desconto_item`; `subtotal = Σ(quantidade × valor_unitário)`; `desconto_total = Σ desconto_item (+ desconto global, se existir)`; `total = subtotal − desconto_total`. Desconto pode ser em valor ou percentual (convertido e armazenado em valor); não pode exceder o valor do item; resultado nunca negativo. Arredondamento a 2 casas, `ROUND_HALF_UP`, aplicado por item. |
| RN-11 | Proposta `Enviada` cuja validade passou é exibida como `Expirada` (calculado na leitura); o estado é persistido pelo scheduler no P1. |
| RN-12 | Exclusão: contatos, empresas, oportunidades, propostas e produtos usam **exclusão lógica** (`deleted_at`). Não é permitido excluir empresa com oportunidades abertas. Eventos nunca são excluídos. |
| RN-13 | Unicidade: CNPJ de empresa e e-mail de contato (quando informados) são únicos entre registros ativos; o sistema alerta possível duplicata (mesmo nome + empresa). |
| RN-14 | Toda mudança relevante (criação, conversão, mudança de estágio, proposta criada/enviada/aceita/recusada, atividade concluída, login) publica um **evento de domínio** persistido em `events`. Essa tabela serve simultaneamente de **timeline e trilha de auditoria** (substitui as duas estruturas separadas da v1.0). |
| RN-15 | "Última interação" = data da última atividade concluída do tipo ligação/reunião/e-mail no contato. "Próxima ação" = follow-up pendente mais próximo. |
| RN-16 | Datas armazenadas em UTC; exibidas no fuso configurado (padrão `America/Sao_Paulo`). Moeda padrão BRL. Idioma da interface: pt-BR (estrutura preparada para i18n). |
| RN-17 | Vendedor só edita registros dos quais é responsável, ou todos (conforme Q-05); somente Admin altera responsável em massa, configura pipeline e gerencia usuários. |

---

# 9. Modelo de Dados (alto nível)

Banco relacional. Toda tabela possui `id` (UUID, **proposto**), `created_at`, `updated_at`; entidades com exclusão lógica possuem `deleted_at`. Chaves estrangeiras e índices em campos de filtro/busca.

```text
users                 (papel, ativo)
companies             (lifecycle_stage, owner_id, ...)
contacts              (company_id, lifecycle_stage, lead_status, lead_temperature, origin_id, owner_id, ...)
origins               (lista configurável)
pipeline_stages       (nome, ordem, tipo, probabilidade_padrão)
loss_reasons
opportunities         (company_id, contact_id, stage_id, valor, probabilidade, expected_close, closed_at, loss_reason_id, ...)
activities            (tipo, status, prioridade, due_at, owner_id, related_type, related_id)
products
proposals             (número, opportunity_id, status, validade, revisão_de, sent_at, accepted_at, ...)
proposal_items        (proposal_id, product_id?, descrição, qtd, unit_price, desconto, total)
tags / entity_tags
events                (occurred_at, user_id, type, entity_type, entity_id, description, metadata JSONB)   -- timeline + auditoria
-- P1:
email_accounts, email_templates, emails, cadences, cadence_steps, cadence_enrollments
```

Observações:

* A tabela `leads` da v1.0 foi removida (ver 6.1).
* Relacionamentos polimórficos (`related_type/related_id`, `entity_type/entity_id`) são aceitos para atividades, eventos e tags; a SPEC deve definir validação de integridade na camada de serviço.
* Isolamento multi-tenant não é implementado no MVP; deixar o **ponto de extensão** documentado (ex.: coluna `tenant_id` nullable ou schema por tenant) para evitar migração destrutiva futura (Q-04).

---

# 10. API

* REST, JSON, **todos os endpoints sob `/api/v1/`** (a v1.0 listava `/api/` e `/api/v1/` de forma inconsistente).
* Autenticação por `Authorization: Bearer <token>`; endpoints protegidos por padrão.
* Paginação (`page`, `page_size` com máximo), ordenação e filtros no backend.
* Documentação OpenAPI gerada automaticamente.

Recursos principais (CRUD salvo indicação):

```text
POST   /api/v1/auth/login | /auth/logout | /auth/refresh | /auth/change-password
GET    /api/v1/users, /users/me
CRUD   /api/v1/companies, /contacts, /products, /opportunities, /proposals, /activities
GET    /api/v1/leads | /prospects | /customers             (visões filtradas de contacts)
POST   /api/v1/contacts/{id}/convert-to-prospect
POST   /api/v1/contacts/{id}/convert-to-customer
POST   /api/v1/opportunities/{id}/move                     (mudança de estágio)
POST   /api/v1/proposals/{id}/send | /accept | /reject | /cancel | /revise
GET    /api/v1/proposals/{id}/pdf
GET    /api/v1/{contacts|companies|opportunities}/{id}/timeline
GET    /api/v1/pipeline/stages   (PUT: Admin)
-- P1
POST   /api/v1/emails/send ; CRUD /email-templates, /cadences
GET    /api/v1/search?q=
GET    /api/v1/dashboard/summary
```

**Resposta padronizada:**

```json
// sucesso
{ "success": true, "data": { }, "meta": { "page": 1, "page_size": 20, "total": 120 } }

// erro
{ "success": false, "error": { "code": "CONTACT_NOT_FOUND", "message": "Contato não encontrado.", "details": [] } }
```

Códigos HTTP coerentes (400/401/403/404/409/422/500); erros de validação trazem detalhe por campo.

---

# 11. Requisitos Não Funcionais

| Área | Requisito |
|---|---|
| **Performance** | Listagens p95 < 500 ms e detalhe p95 < 300 ms com até 50 mil contatos e 10 mil oportunidades; paginação obrigatória; índices em chaves de busca/filtro; tarefas demoradas (PDF pesado, e-mail em lote) assíncronas quando houver worker. |
| **Segurança** | Hash de senha (argon2/bcrypt); tokens com expiração; autorização verificada no backend em todo endpoint; validação de entrada (schemas); proteção contra SQL Injection (ORM/parametrização) e XSS (sanitização de HTML de e-mail/observações); CORS configurável; rate limit no login; secrets só por variáveis de ambiente, nada no repositório; `.env` no `.gitignore`. |
| **Privacidade (LGPD)** | Dados pessoais mínimos; possibilidade de excluir/anonimizar um contato a pedido do titular (exceção documentada à RN-12 de exclusão lógica); logs não registram dados sensíveis nem senhas. |
| **Observabilidade** | Logging estruturado (JSON) com níveis DEBUG/INFO/WARNING/ERROR e campos: timestamp, request_id, user_id, serviço, erro, contexto. Endpoint de health-check. |
| **Confiabilidade** | Migrations versionadas e reversíveis; transações nas conversões e mudanças de estágio (evento + alteração atômicos); backup do banco documentado no README. |
| **Usabilidade** | Desktop primeiro; funcional em notebook e tablet; navegação enxuta; mensagens de erro claras em pt-BR; confirmações em ações destrutivas. |
| **Portabilidade** | `docker compose up -d` sobe o ambiente; perfis `development` e `production`; `.env.example` completo. |
| **Manutenibilidade** | Separação de camadas; lint/format/type-check (ruff, mypy opcional, eslint, vue-tsc) no CI **(proposto)**. |
| **Compatibilidade** | Chrome, Edge, Firefox e Safari atuais (duas últimas versões). |

---

# 12. Configuração

`.env` (nunca versionado) com `.env.example` versionado:

```env
APP_ENV=production
DATABASE_URL=
JWT_SECRET=
JWT_ACCESS_TTL_MINUTES=
CORS_ORIGINS=
DEFAULT_TIMEZONE=America/Sao_Paulo
ADMIN_EMAIL=
ADMIN_PASSWORD=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
AI_ENABLED=false
AI_API_URL=
```

---

# 13. UX / Navegação

```text
Dashboard (P1)

CRM:        Leads | Prospects | Clientes | Empresas | Contatos
Vendas:     Pipeline | Oportunidades | Propostas
Atividades: Tarefas e Follow-ups | Agenda (P1)
Comunicação (P1): E-mails | Templates | Cadências
Catálogo:   Produtos e Serviços
Configurações: Usuário | Equipe | Pipeline e Listas | E-mail (P1) | Sistema
```

* No MVP, a página inicial é **"Minhas tarefas / follow-ups"** até o dashboard existir.
* Itens P1 ficam ocultos até estarem disponíveis (sem menus vazios).
* **Tela de detalhes** (Empresa, Contato, Oportunidade) com abas: Dados · Oportunidades · Atividades · Propostas · Histórico (timeline). A ação principal (registrar atividade, converter, criar proposta) fica visível no topo.
* Padrões de interface (cores, tipografia, componentes, tabelas, formulários, dark/light) seguem o Vision.AI.
* Estados vazios, carregamento e erro tratados em todas as listagens.

---

# 14. Testes e Qualidade

Backend (obrigatório), por prioridade: (1) regras de negócio (RN-xx); (2) autenticação/autorização; (3) conversões Lead→Prospect→Cliente; (4) oportunidades e estágios; (5) propostas e cálculo (casos de arredondamento/desconto); (6) e-mail (P1); (7) cadências (P1).

* Testes de API para cada endpoint principal (sucesso, validação, permissão).
* Frontend: testes de componentes críticos (formulário de proposta, Kanban, conversões) e um fluxo E2E do caminho principal **(proposto)**.
* Meta de cobertura: ≥ 80% em `services/` e `domain/`.

---

# 15. Estrutura de Projeto

```text
mini-crm/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   ├── core/            (config, security, logging, errors)
│   │   ├── domain/          (entidades, regras puras, eventos)
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── integrations/    (smtp, pdf, futura IA)
│   │   └── workers/         (P1)
│   ├── migrations/
│   ├── tests/
│   └── pyproject.toml | requirements.txt
├── frontend/
│   ├── src/{components,views,layouts,composables,services,stores,types}/
│   └── package.json
├── docker/
├── docs/                    (PRD.md, SPEC.md)
├── docker-compose.yml
├── .env.example
└── README.md
```

---

# 16. Escopo e Roadmap

## 16.1 Prioridades

**P0 — MVP:** autenticação e usuários; empresas; contatos; leads/prospects/clientes e conversões; oportunidades e pipeline; atividades, follow-ups e timeline; produtos/serviços; propostas e PDF; eventos/auditoria; Docker; API REST.

**P1 — Segunda etapa:** e-mail, templates, cadências, scheduler/worker, dashboard, tags, busca global, agenda em calendário, recuperação de senha por e-mail.

**P2 — Evolução:** automações por eventos, webhooks, integrações, IA (scoring, resumo, próxima ação, geração de e-mail, sentimento), tracking de visualização de proposta, multi-tenant, importação/exportação.

## 16.2 Roadmap

| Fase | Tema | Conteúdo |
|---|---|---|
| 1 | Core CRM | CRM, pipeline, atividades, propostas, histórico |
| 2 | Comunicação | E-mail, templates, cadências, scheduler |
| 3 | Automação | Triggers, workflows, webhooks, integrações |
| 4 | IA | Scoring, resumo, next best action, geração de e-mail, agentes |
| 5 | Ecossistema | WhatsApp, ERP, marketing, BI, data lake, MCP |

## 16.3 Visão de longo prazo

Evoluir de CRM tradicional para **CRM + Automação + IA**, permitindo que o usuário comece usando só o CRM e habilite automações e IA depois, sem migrar de plataforma. A IA futura será um serviço independente (LLM, embeddings, vector DB, agentes) consumindo a API e os eventos do CRM, e **jamais obrigatório** para o funcionamento básico.

---

# 17. Critérios de Aceite — MVP

Cada item deve virar ao menos um caso de teste na SPEC.

**CRM**
* Cadastrar empresa (CNPJ inválido ou duplicado é rejeitado).
* Cadastrar contato vinculado a empresa.
* Cadastrar lead e avançar seu status até `Qualificado`.
* Converter Lead → Prospect; a conversão é bloqueada se não estiver `Qualificado`.
* Converter Prospect → Cliente manualmente e via oportunidade ganha.
* Visualizar timeline completa do contato, incluindo eventos anteriores à conversão.

**Vendas**
* Criar oportunidade (bloqueada para lead puro sem conversão).
* Mover no Kanban e por formulário; probabilidade acompanha o estágio.
* Fechar como perdida exige motivo; fechar como ganha converte para Cliente.
* Registrar valor e previsão de fechamento; totais por coluna corretos.

**Atividades**
* Criar tarefa; registrar ligação e reunião; definir follow-up.
* Follow-ups vencidos aparecem destacados como atrasados.
* Listar atividades pendentes filtradas por responsável.

**Propostas**
* Criar proposta vinculada à oportunidade, adicionar produtos e itens avulsos.
* Subtotal, desconto e total conforme RN-10.
* Alterar status conforme RF-65; proposta enviada fica somente leitura; revisar cria nova proposta.
* Gerar PDF correto e consistente com os dados da tela.

**Segurança e Infraestrutura**
* Endpoint sem token retorna 401; Vendedor acessando recurso de Admin retorna 403.
* Subir ambiente via Docker a partir de `.env.example`; migrations executadas automaticamente ou por comando documentado; API em `/api/v1`, documentação OpenAPI e frontend acessíveis.

---

# 18. Princípios de Desenvolvimento

* **KISS** — manter simples; evitar abstrações desnecessárias.
* **Modularidade** — cada domínio com responsabilidade clara.
* **Reutilização** — aproveitar padrões do pro-ai-assistant e do Vision.AI quando apropriado, sem acoplamento.
* **API First** — lógica comercial no backend, acessível via API.
* **AI Ready / Automation Ready** — eventos persistidos e metadados permitem IA e workflows no futuro sem torná-los dependência.
* **Self-hosted Ready** — sem dependência obrigatória de SaaS externo.

---

# 19. Questões em Aberto (resolver antes/durante a SPEC)

| ID | Questão | Sugestão / padrão assumido |
|---|---|---|
| Q-01 | Confirmar stack: FastAPI, PostgreSQL, SQLAlchemy/Alembic, Pinia, Vite, biblioteca de PDF. | Conforme seção 5 (proposto). |
| Q-02 | Confirmar modelo de ciclo de vida como atributo (seção 6.1) em vez de entidades separadas. | Adotado nesta versão. |
| Q-03 | O que exatamente será reaproveitado do `vision.ai` e do `pro-ai-assistant`? Os dois repositórios estão acessíveis? | Levantar inventário no início da SPEC. |
| Q-04 | Multi-tenant: nunca, futuro próximo ou necessário já? Define se `tenant_id` entra no esquema desde o início. | Single-tenant com ponto de extensão. |
| Q-05 | Visibilidade: vendedor vê/edita todos os registros ou só os próprios? | Vê todos; edita os próprios (ou todos) — decidir. |
| Q-06 | Uma empresa pode ter ciclo de vida diferente do contato (ex.: empresa cliente com contato lead)? | Empresa herda o "mais avançado" entre seus contatos. |
| Q-07 | Importação de CSV de planilhas existentes é necessária no MVP (o objetivo cita "eliminar planilhas")? | Se sim, entra como P0 (RF novo). |
| Q-08 | Dados da empresa emissora e logo para o PDF: onde ficam e há um template de PDF de referência? | Configurações → Sistema; template padrão simples. |
| Q-09 | Moeda única (BRL) ou multi-moeda? | BRL única. |
| Q-10 | Anexos (arquivos) em contatos/oportunidades são necessários no MVP? Onde armazenar (disco/volume/S3)? | Fora do MVP, exceto PDF gerado sob demanda. |
| Q-11 | Dashboard e busca global permanecem P1 ou sobem para o MVP? | Busca simples por nome no MVP; dashboard P1. |

---

# Fim do PRD
