# PRD — MINI-CRM

**Versão:** 1.0
**Status:** Draft
**Produto:** MINI-CRM
**Tipo:** CRM Web B2B
**Objetivo:** Gestão simplificada de Leads, Prospects, Clientes e Oportunidades

---

# 1. Visão do Produto

O **MINI-CRM** é uma aplicação web de CRM compacta, moderna e modular, destinada ao gerenciamento do ciclo comercial de empresas.

O sistema deverá permitir acompanhar a jornada de um contato desde sua entrada como **Lead**, passando pela qualificação como **Prospect**, até sua conversão em **Cliente**, mantendo todo o histórico comercial e de relacionamento.

O produto deverá priorizar:

* simplicidade;
* velocidade de uso;
* baixa complexidade operacional;
* interface moderna;
* facilidade de manutenção;
* arquitetura modular;
* possibilidade de execução local, on-premise ou cloud;
* preparação para integrações futuras com IA, Machine Learning e automações.

A primeira versão deverá evitar funcionalidades excessivamente complexas de CRMs tradicionais, concentrando-se no núcleo essencial da operação comercial.

---

# 2. Objetivos

## 2.1 Objetivo principal

Disponibilizar uma plataforma simples para controlar o processo comercial de ponta a ponta:

```text
Lead
  ↓
Qualificação
  ↓
Prospect
  ↓
Oportunidade
  ↓
Proposta
  ↓
Negociação
  ↓
Cliente
  ↓
Pós-venda
```

## 2.2 Objetivos específicos

* Centralizar informações comerciais.
* Eliminar controles dispersos em planilhas.
* Facilitar o acompanhamento de oportunidades.
* Registrar interações com contatos.
* Controlar follow-ups.
* Criar e acompanhar propostas comerciais.
* Permitir envio de e-mails pelo CRM.
* Criar cadências comerciais.
* Manter histórico completo do relacionamento.
* Criar uma arquitetura preparada para IA.
* Permitir futuras automações baseadas em eventos.

---

# 3. Não Objetivos — MVP

O MVP não deverá tentar competir diretamente com plataformas completas como Salesforce, HubSpot ou Dynamics.

Ficam fora do escopo inicial:

* ERP;
* faturamento;
* emissão fiscal;
* gestão financeira completa;
* atendimento/ticketing;
* marketing automation avançado;
* campanhas massivas de e-mail;
* telefonia/VoIP;
* WhatsApp oficial;
* gestão avançada de contratos;
* BI corporativo;
* previsão financeira avançada;
* Machine Learning próprio.

Esses recursos poderão ser adicionados posteriormente através de módulos.

---

# 4. Público-alvo

O sistema deverá atender principalmente:

* pequenas e médias empresas;
* equipes comerciais;
* empresas de serviços;
* consultorias;
* empresas de tecnologia;
* representantes comerciais;
* profissionais de vendas B2B;
* equipes de pré-vendas e vendas.

O sistema deverá funcionar tanto para um usuário individual quanto para pequenas equipes comerciais.

---

# 5. Stack Tecnológica

## 5.1 Backend

**Python**

Preferência por uma arquitetura organizada em camadas, permitindo futura integração com:

* Machine Learning;
* LLMs;
* agentes de IA;
* automações;
* APIs externas;
* processamento assíncrono.

Arquitetura sugerida:

```text
API
 ↓
Services / BPO
 ↓
Domain
 ↓
DAO / Repository
 ↓
Database
```

O backend deverá manter separação clara entre:

* API;
* regras de negócio;
* persistência;
* integrações;
* tarefas assíncronas.

---

# 6. Frontend

**Vue 3 + TypeScript**

O frontend deverá utilizar arquitetura modular baseada em componentes.

Preferências:

* Vue 3;
* TypeScript;
* Composition API;
* componentes reutilizáveis;
* gerenciamento de estado quando necessário;
* comunicação com API REST;
* formulários tipados;
* validação de dados.

---

# 7. Identidade Visual

A interface deverá utilizar como referência o projeto:

```text
D:\projects\personal\vision.ai
```

Deverão ser reutilizados, quando tecnicamente possível:

* paleta de cores;
* tipografia;
* espaçamentos;
* componentes;
* bordas;
* cards;
* botões;
* inputs;
* tabelas;
* menus;
* ícones;
* padrões de navegação;
* comportamento responsivo;
* dark/light mode, caso existente no projeto de referência.

O objetivo não é simplesmente copiar telas, mas manter uma **linguagem visual consistente com o Vision.AI**.

---

# 8. Referência Arquitetural

A arquitetura deverá utilizar como referência estrutural o projeto:

```text
D:\projects\projjetta\pro-ai-assistant
```

Deverão ser avaliados e reutilizados, quando fizer sentido:

* organização de backend;
* estrutura de projetos;
* configuração;
* Docker;
* variáveis de ambiente;
* autenticação;
* banco de dados;
* migrations;
* organização de APIs;
* logging;
* tratamento de erros;
* padrões de desenvolvimento.

A reutilização deverá evitar acoplamento desnecessário entre os projetos.

---

# 9. Arquitetura Geral

Arquitetura inicial:

```text
                    ┌────────────────────┐
                    │      Browser       │
                    │   Vue 3 + TS       │
                    └─────────┬──────────┘
                              │
                         REST / HTTP
                              │
                    ┌─────────▼──────────┐
                    │      Backend       │
                    │      Python        │
                    └─────────┬──────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
       ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
       │ Database│       │  Email  │       │ Future  │
       │         │       │ Service │       │   AI    │
       └─────────┘       └─────────┘       └─────────┘
```

Todos os componentes deverão ser executáveis através de containers.

---

# 10. Infraestrutura

A aplicação deverá ser distribuída através de Docker.

Estrutura conceitual:

```text
docker-compose.yml

frontend
backend
database
worker
scheduler
```

Nem todos os serviços precisam estar presentes no MVP.

A arquitetura deverá permitir execução em:

### Local

```text
Windows / Linux / macOS
```

### Servidor próprio

```text
Linux + Docker
```

### Cloud

```text
Azure
AWS
GCP
ou outro provedor
```

---

# 11. Autenticação e Usuários

O sistema deverá possuir autenticação.

Funcionalidades mínimas:

* login;
* logout;
* recuperação de senha;
* alteração de senha;
* sessão autenticada;
* usuário ativo/inativo.

Estrutura preparada para:

* múltiplos usuários;
* equipes;
* permissões;
* multi-tenant.

No MVP, o modelo de permissões deverá permanecer simples.

---

# 12. Modelo Comercial

O sistema deverá trabalhar com os seguintes conceitos principais:

```text
Pessoa
Empresa
Lead
Prospect
Cliente
Oportunidade
Atividade
Proposta
Produto/Serviço
E-mail
Cadência
```

---

# 13. Pessoa / Contato

Um contato deverá possuir:

* nome;
* sobrenome;
* e-mail;
* telefone;
* celular;
* cargo;
* empresa;
* observações;
* origem;
* responsável;
* status;
* tags;
* data de criação;
* data de atualização.

Um contato poderá estar associado a uma empresa.

---

# 14. Empresa

Cadastro de empresas relacionadas aos contatos.

Campos mínimos:

* razão social;
* nome fantasia;
* CNPJ;
* site;
* e-mail;
* telefone;
* endereço;
* cidade;
* estado;
* país;
* segmento;
* porte;
* observações;
* responsável;
* tags.

Uma empresa poderá possuir vários contatos.

---

# 15. Lead

Lead representa um potencial contato comercial ainda não qualificado.

Informações:

* contato;
* empresa;
* origem;
* responsável;
* status;
* temperatura;
* tags;
* observações;
* data de criação;
* última interação;
* próxima ação.

Status sugeridos:

```text
Novo
Em contato
Qualificando
Qualificado
Desqualificado
Convertido
```

---

# 16. Prospect

Um Lead poderá ser convertido em Prospect.

A conversão deverá preservar integralmente o histórico anterior.

Exemplo:

```text
Lead
 ├── Interações
 ├── E-mails
 ├── Atividades
 └── Observações
        ↓
     Prospect
        ↓
   Oportunidade
```

Nenhum histórico deverá ser perdido durante a conversão.

---

# 17. Cliente

Um Prospect poderá ser convertido em Cliente.

A conversão deverá preservar:

* informações cadastrais;
* histórico;
* atividades;
* oportunidades;
* propostas;
* e-mails;
* observações.

O sistema deverá permitir continuar registrando atividades após a conversão.

---

# 18. Funil de Vendas

O sistema deverá possuir um funil visual.

Exemplo:

```text
Novo
 ↓
Qualificação
 ↓
Reunião
 ↓
Proposta
 ↓
Negociação
 ↓
Fechado Ganho
 ↓
Fechado Perdido
```

Cada oportunidade deverá possuir:

* nome;
* empresa;
* contato;
* responsável;
* valor;
* estágio;
* probabilidade;
* data prevista de fechamento;
* origem;
* observações;
* atividades;
* propostas.

---

# 19. Pipeline Visual

A interface deverá permitir visualizar oportunidades em formato Kanban.

Exemplo:

```text
┌───────────┐ ┌────────────┐ ┌───────────┐ ┌────────────┐
│ Qualificar│ │  Reunião   │ │ Proposta  │ │ Negociação │
├───────────┤ ├────────────┤ ├───────────┤ ├────────────┤
│ Empresa A │ │ Empresa B  │ │ Empresa C │ │ Empresa D  │
│ R$ 10.000  │ │ R$ 20.000  │ │ R$ 15.000 │ │ R$ 30.000  │
└───────────┘ └────────────┘ └───────────┘ └────────────┘
```

Deverá ser possível:

* mover oportunidade entre etapas;
* visualizar valor;
* visualizar responsável;
* abrir detalhes;
* registrar atividade;
* criar proposta.

---

# 20. Histórico / Timeline

Cada Lead, Prospect, Cliente e Oportunidade deverá possuir uma timeline.

Exemplo:

```text
05/10 10:30
✉ E-mail enviado

04/10 14:00
📞 Ligação registrada

03/10 09:00
📝 Reunião agendada

01/10 16:30
🔄 Oportunidade alterada para "Proposta"

28/09 11:20
👤 Lead criado
```

Eventos deverão possuir:

* data/hora;
* usuário;
* tipo;
* descrição;
* entidade relacionada;
* metadados opcionais.

---

# 21. Atividades

O sistema deverá permitir registrar:

* ligação;
* reunião;
* tarefa;
* e-mail;
* nota;
* follow-up;
* outros eventos.

Cada atividade poderá possuir:

* título;
* descrição;
* responsável;
* data;
* horário;
* status;
* prioridade;
* entidade relacionada.

Status:

```text
Pendente
Concluída
Cancelada
```

---

# 22. Follow-up

O usuário deverá conseguir definir a próxima ação comercial.

Exemplo:

```text
Cliente: Empresa XYZ
Último contato: 05/10
Próximo contato: 08/10
Ação: Ligar para verificar proposta
Responsável: Carlos
```

O sistema deverá destacar follow-ups atrasados.

---

# 23. Propostas Comerciais

O CRM deverá permitir criar propostas associadas a uma oportunidade.

Uma proposta deverá possuir:

### Cabeçalho

* número;
* cliente;
* contato;
* oportunidade;
* data;
* validade;
* responsável.

### Itens

* produto/serviço;
* descrição;
* quantidade;
* valor unitário;
* desconto;
* valor total.

### Condições

* prazo;
* forma de pagamento;
* observações;
* validade.

---

# 24. Status da Proposta

Estados mínimos:

```text
Rascunho
Enviada
Visualizada
Aceita
Recusada
Expirada
Cancelada
```

A arquitetura deverá permitir futuramente registrar eventos como:

* data de envio;
* data de visualização;
* data de aceite;
* usuário responsável.

---

# 25. Geração de PDF

O sistema deverá permitir gerar uma proposta em PDF.

O documento deverá possuir:

* identidade visual;
* dados da empresa;
* dados do cliente;
* descrição dos produtos/serviços;
* valores;
* descontos;
* total;
* condições comerciais;
* validade;
* observações.

A geração deverá ser realizada no backend.

---

# 26. Produtos e Serviços

Cadastro básico de itens comercializados.

Campos:

* código;
* nome;
* descrição;
* categoria;
* unidade;
* preço padrão;
* ativo/inativo.

O produto deverá poder ser selecionado durante a criação de propostas.

---

# 27. E-mail

O CRM deverá permitir envio de e-mails.

Funcionalidades:

* configurar conta de envio;
* enviar e-mail;
* destinatário;
* cópia;
* assunto;
* corpo HTML;
* anexos;
* templates;
* histórico.

Cada e-mail enviado deverá ser associado ao contexto comercial.

Exemplo:

```text
Empresa XYZ
 └── Oportunidade #102
      ├── E-mail enviado
      ├── Reunião
      ├── Proposta
      └── Follow-up
```

---

# 28. Templates de E-mail

Usuários deverão poder criar templates reutilizáveis.

Exemplo:

```text
Olá {{nome}},

Conforme conversamos, estou enviando nossa proposta
comercial para {{empresa}}.

Atenciosamente,
{{usuario}}
```

Variáveis deverão ser substituídas automaticamente.

Variáveis iniciais:

```text
{{nome}}
{{empresa}}
{{email}}
{{telefone}}
{{oportunidade}}
{{valor}}
{{usuario}}
```

A arquitetura deverá permitir adicionar novas variáveis futuramente.

---

# 29. Cadências

O sistema deverá permitir criar cadências comerciais.

Exemplo:

```text
Dia 0
↓
Enviar e-mail inicial

Dia 2
↓
Follow-up

Dia 5
↓
Novo e-mail

Dia 8
↓
Criar tarefa de ligação
```

Uma cadência deverá possuir:

* nome;
* descrição;
* status;
* etapas;
* intervalo;
* template;
* ação.

---

# 30. Scheduler

As ações programadas deverão ser executadas através de um scheduler.

Possíveis ações:

* enviar e-mail;
* criar tarefa;
* criar follow-up;
* alterar status;
* disparar webhook;
* executar automação futura.

O scheduler deverá ser desacoplado do backend principal.

---

# 31. Busca

O sistema deverá possuir busca global.

A busca deverá considerar:

* pessoas;
* empresas;
* leads;
* prospects;
* clientes;
* oportunidades;
* propostas.

Exemplo:

```text
"Empresa XYZ"
```

deverá retornar todas as entidades relacionadas.

---

# 32. Tags

Entidades comerciais poderão receber tags.

Exemplos:

```text
Hot
VIP
Indústria
Saúde
Power BI
IA
Alta prioridade
```

As tags deverão permitir filtros.

---

# 33. Dashboard

O dashboard inicial deverá apresentar informações resumidas.

Indicadores:

* Leads;
* Prospects;
* Clientes;
* Oportunidades abertas;
* Valor do pipeline;
* Propostas enviadas;
* Propostas aceitas;
* Follow-ups pendentes;
* Follow-ups atrasados.

Exemplo:

```text
┌────────────┐ ┌────────────┐ ┌────────────┐
│ Leads      │ │ Prospects  │ │ Clientes   │
│    120     │ │     42     │ │     18     │
└────────────┘ └────────────┘ └────────────┘

Pipeline
R$ 385.000

Propostas
12 enviadas
7 aceitas
```

O dashboard deverá permanecer simples.

---

# 34. Automação por Eventos

A arquitetura deverá permitir futuramente ações baseadas em eventos.

Exemplo:

```text
EVENTO
Lead criado
   ↓
TRIGGER
   ↓
AÇÃO
Adicionar à cadência
```

Outros exemplos:

```text
Proposta enviada
      ↓
Criar follow-up em 3 dias
```

```text
Lead convertido
      ↓
Executar workflow
```

---

# 35. Preparação para IA

A arquitetura deverá ser criada considerando futuras funcionalidades de IA.

Possibilidades futuras:

### Lead Scoring

Classificar automaticamente leads.

```text
Lead → IA → Score 87/100
```

### Resumo de relacionamento

Gerar automaticamente:

> "Cliente possui interesse em BI e IA. Foram realizadas três reuniões. Proposta de R$ 45.000 enviada há quatro dias."

### Sugestão de próxima ação

```text
Próxima melhor ação:
Entrar em contato para acompanhamento da proposta.
```

### Geração de e-mail

```text
Contexto comercial
       ↓
       IA
       ↓
E-mail personalizado
```

### Análise de sentimento

Analisar interações e identificar:

* interesse;
* dúvida;
* objeção;
* insatisfação;
* intenção de compra.

Essas funcionalidades não fazem parte do MVP, mas a arquitetura deverá permitir sua implementação.

---

# 36. Arquitetura de IA

Futuramente poderá existir um serviço independente:

```text
CRM
 │
 ├── API
 │
 ├── Database
 │
 ├── Scheduler
 │
 └── AI Service
       │
       ├── LLM
       ├── Embeddings
       ├── Vector DB
       └── Agents
```

A camada de IA não deverá ser obrigatória para o funcionamento básico do CRM.

---

# 37. API

O backend deverá disponibilizar API REST.

Exemplos:

```text
POST   /api/auth/login

GET    /api/contacts
POST   /api/contacts
GET    /api/contacts/{id}
PUT    /api/contacts/{id}
DELETE /api/contacts/{id}

GET    /api/companies
POST   /api/companies

GET    /api/leads
POST   /api/leads

POST   /api/leads/{id}/convert

GET    /api/opportunities
POST   /api/opportunities
PUT    /api/opportunities/{id}

GET    /api/proposals
POST   /api/proposals

POST   /api/emails/send

GET    /api/activities
POST   /api/activities
```

A API deverá ser versionável:

```text
/api/v1/
```

---

# 38. Banco de Dados

Banco relacional.

Entidades principais:

```text
users
companies
contacts
leads
opportunities
pipeline_stages
activities
proposals
proposal_items
products
email_templates
emails
cadences
cadence_steps
tags
entity_tags
audit_events
```

Os relacionamentos deverão ser projetados para preservar o histórico comercial.

---

# 39. Auditoria

Alterações relevantes deverão poder ser registradas.

Exemplos:

```text
Lead criado
Lead convertido
Oportunidade criada
Estágio alterado
Proposta criada
Proposta enviada
Proposta aceita
Cliente convertido
```

A estrutura de auditoria também será importante para futuras funcionalidades de IA.

---

# 40. UX / Navegação

Menu principal sugerido:

```text
Dashboard

CRM
 ├── Leads
 ├── Prospects
 ├── Clientes
 ├── Empresas
 └── Contatos

Vendas
 ├── Pipeline
 ├── Oportunidades
 └── Propostas

Atividades
 ├── Agenda
 ├── Tarefas
 └── Follow-ups

Comunicação
 ├── E-mails
 ├── Templates
 └── Cadências

Catálogo
 └── Produtos e Serviços

Configurações
 ├── Usuário
 ├── Equipe
 ├── E-mail
 └── Sistema
```

A navegação deverá permanecer enxuta e evitar excesso de menus.

---

# 41. Tela de Detalhes

A tela de detalhes de uma entidade comercial deverá concentrar as informações.

Exemplo:

```text
┌──────────────────────────────────────────────┐
│ Empresa XYZ                                  │
│ Indústria                                    │
├──────────────────────────────────────────────┤
│ Dados │ Oportunidades │ Atividades │ Histórico│
├──────────────────────────────────────────────┤
│                                              │
│ Timeline                                     │
│                                              │
│ 05/10  E-mail enviado                        │
│ 04/10  Reunião realizada                     │
│ 01/10  Proposta enviada                      │
│                                              │
└──────────────────────────────────────────────┘
```

---

# 42. Responsividade

O sistema deverá funcionar em:

* Desktop;
* Notebook;
* Tablet.

O foco inicial será desktop, considerando o uso comercial.

---

# 43. Segurança

Requisitos mínimos:

* autenticação segura;
* senhas armazenadas com hash;
* tokens de autenticação;
* proteção de endpoints;
* validação de entrada;
* controle de acesso;
* proteção contra SQL Injection;
* proteção contra XSS;
* CORS configurável;
* secrets através de environment variables;
* nenhuma credencial armazenada no código.

---

# 44. Configuração

A aplicação deverá utilizar `.env`.

Exemplo conceitual:

```env
APP_ENV=production

DATABASE_URL=

JWT_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

AI_ENABLED=false
AI_API_URL=
```

Segredos nunca deverão ser versionados.

---

# 45. Logging

O backend deverá possuir logging estruturado.

Categorias:

```text
INFO
WARNING
ERROR
DEBUG
```

Logs deverão permitir identificar:

* requisição;
* usuário;
* erro;
* serviço;
* timestamp;
* contexto.

---

# 46. Tratamento de Erros

A API deverá utilizar respostas padronizadas.

Exemplo:

```json
{
  "success": false,
  "error": {
    "code": "CONTACT_NOT_FOUND",
    "message": "Contato não encontrado."
  }
}
```

---

# 47. Performance

O MVP deverá priorizar simplicidade, mas a arquitetura deverá permitir crescimento.

Requisitos:

* paginação;
* filtros no backend;
* índices de banco;
* consultas eficientes;
* carregamento sob demanda;
* processamento assíncrono para tarefas demoradas.

---

# 48. Testes

O backend deverá possuir testes automatizados.

Prioridade:

1. regras de negócio;
2. autenticação;
3. conversão Lead → Prospect;
4. conversão Prospect → Cliente;
5. oportunidades;
6. propostas;
7. envio de e-mail;
8. cadências.

Frontend deverá possuir testes para componentes críticos quando necessário.

---

# 49. Docker

O projeto deverá possuir:

```text
Dockerfile
docker-compose.yml
.env.example
```

Ambientes:

```text
development
production
```

O ambiente deverá poder ser iniciado com poucos comandos.

Exemplo:

```bash
docker compose up -d
```

---

# 50. Estrutura de Projeto

Estrutura sugerida:

```text
mini-crm/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── integrations/
│   │   └── workers/
│   │
│   ├── migrations/
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── layouts/
│   │   ├── composables/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   └── package.json
│
├── docker/
│
├── docs/
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

# 51. MVP — Prioridades

O MVP deverá concentrar-se nas seguintes funcionalidades:

## P0 — Obrigatório

* autenticação;
* usuários;
* empresas;
* contatos;
* leads;
* prospects;
* clientes;
* conversão Lead → Prospect;
* conversão Prospect → Cliente;
* oportunidades;
* pipeline;
* atividades;
* histórico/timeline;
* follow-ups;
* produtos/serviços;
* propostas;
* geração de PDF;
* Docker;
* API REST.

## P1 — Segunda etapa

* envio de e-mails;
* templates;
* cadências;
* scheduler;
* dashboard;
* tags;
* busca global.

## P2 — Evolução

* automações;
* webhooks;
* integração com APIs externas;
* IA;
* lead scoring;
* geração automática de e-mails;
* resumo automático;
* recomendação de próxima ação.

---

# 52. Fluxo Principal do MVP

Fluxo esperado:

```text
                    ┌─────────────┐
                    │     Lead    │
                    └──────┬──────┘
                           │
                     Qualificação
                           │
                    ┌──────▼──────┐
                    │   Prospect  │
                    └──────┬──────┘
                           │
                     Oportunidade
                           │
                    ┌──────▼──────┐
                    │  Proposta   │
                    └──────┬──────┘
                           │
                      Negociação
                           │
                 ┌─────────┴─────────┐
                 │                   │
            Fechado Ganho       Fechado Perdido
                 │
          ┌──────▼──────┐
          │   Cliente   │
          └─────────────┘
```

Durante todo o processo:

```text
             ┌──────────────┐
             │   Timeline   │
             └──────┬───────┘
                    │
       ┌────────────┼─────────────┐
       │            │             │
    E-mails      Atividades    Follow-ups
       │            │             │
       └────────────┼─────────────┘
                    │
                Histórico
```

---

# 53. Critérios de Aceite — MVP

O MVP será considerado funcional quando o usuário conseguir:

### CRM

* cadastrar uma empresa;
* cadastrar um contato;
* cadastrar um Lead;
* converter Lead em Prospect;
* converter Prospect em Cliente;
* visualizar histórico completo.

### Vendas

* criar oportunidade;
* movimentar oportunidade no pipeline;
* alterar estágio;
* registrar valor;
* definir previsão de fechamento.

### Atividades

* criar tarefa;
* registrar ligação;
* registrar reunião;
* definir follow-up;
* visualizar atividades pendentes.

### Propostas

* criar proposta;
* adicionar produtos;
* calcular subtotal;
* aplicar desconto;
* calcular total;
* alterar status;
* gerar PDF;
* associar proposta à oportunidade.

### Infraestrutura

* executar aplicação via Docker;
* configurar através de `.env`;
* executar migrations;
* acessar API;
* acessar frontend.

---

# 54. Princípios de Desenvolvimento

## KISS

Manter a aplicação simples.

Evitar abstrações desnecessárias.

## Modularidade

Cada domínio deverá possuir responsabilidade clara.

## Reutilização

Reutilizar componentes e padrões existentes do ProAgentHub e Vision.AI quando apropriado.

## API First

A lógica comercial deverá estar no backend e ser acessível através da API.

## AI Ready

A arquitetura deverá permitir integração futura com IA sem tornar a IA uma dependência do CRM.

## Automation Ready

Eventos e tarefas deverão permitir futura criação de workflows.

## Self-hosted Ready

O sistema deverá funcionar sem dependência obrigatória de serviços SaaS externos.

---

# 55. Roadmap Futuro

### Fase 1 — Core CRM

```text
CRM
Pipeline
Atividades
Propostas
Histórico
```

### Fase 2 — Comunicação

```text
E-mail
Templates
Cadências
Scheduler
```

### Fase 3 — Automação

```text
Triggers
Workflows
Webhooks
Integrações
```

### Fase 4 — IA

```text
Lead Scoring
Resumo automático
Next Best Action
Geração de e-mails
Análise de relacionamento
Agentes
```

### Fase 5 — Ecossistema

```text
WhatsApp
ERP
Marketing
BI
Data Lake
APIs externas
MCP
```

---

# 56. Visão de Longo Prazo

O MINI-CRM deverá evoluir de um CRM tradicional para uma plataforma de **CRM + Automação + IA**.

A arquitetura futura poderá ser representada como:

```text
                     MINI-CRM
                         │
        ┌────────────────┼────────────────┐
        │                │                │
       CRM          Automação             IA
        │                │                │
   ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
   │ Leads   │      │Workflow │      │   LLM   │
   │ Clientes│      │Triggers │      │ Agents  │
   │ Vendas  │      │Scheduler│      │ Scoring │
   └─────────┘      └─────────┘      └─────────┘
                         │
                    Integrações
                         │
              ┌──────────┼──────────┐
              │          │          │
             ERP       E-mail    WhatsApp
```

O objetivo é que o usuário possa inicialmente utilizar o produto simplesmente como CRM, mas posteriormente habilitar automações e inteligência artificial sem precisar migrar para outra plataforma.

---

# 57. Resultado Esperado

O resultado final do MVP deverá ser um CRM:

* simples;
* rápido;
* moderno;
* intuitivo;
* modular;
* containerizado;
* fácil de instalar;
* fácil de manter;
* adequado para pequenas e médias equipes;
* independente de serviços externos para suas funções básicas;
* preparado para integrações;
* preparado para automações;
* preparado para IA.

A prioridade deverá ser **entregar um núcleo comercial sólido antes de adicionar funcionalidades avançadas**.

---

# Fim do PRD
