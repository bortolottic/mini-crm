# Resumo inicial — MINI-CRM

**Objetivo**: desenvolver um CRM compacto, moderno e de fácil manutenção, voltado para gestão de leads, prospects e clientes, acompanhando toda a jornada comercial desde a captura até a conversão e relacionamento pós-venda.

## Stack principal

- Backend: Python, priorizando facilidade de integração futura com Machine Learning, IA e automações.
- Frontend: Vue 3 + TypeScript.
- Infraestrutura: Docker/containers, permitindo execução simplificada em ambiente local, servidor próprio ou cloud.
- Base de desenvolvimento: utilizar como referência estrutural o projeto ProAgentHub, localizado em D:\projects\projjetta\pro-ai-assistant.
- UI/UX: utilizar como referência visual o projeto Vision.AI, localizado em D:\projects\personal\vision.ai, mantendo seu padrão de cores, tipografia, componentes, espaçamentos e linguagem visual.

## Gestão comercial

- Cadastro e gerenciamento de Lead, Prospect e Cliente.
- Histórico completo da trajetória do contato, incluindo interações, atividades, alterações de estágio, contatos realizados, propostas e demais eventos relevantes.
- Organização dos contatos e empresas relacionadas.
- Funil de vendas simples, visual e de fácil manutenção.
- Controle de etapas, oportunidades e evolução dos negócios.
- Registro de atividades e follow-ups.
- Possibilidade de transformar um lead em prospect e posteriormente em cliente, preservando todo o histórico.

## Propostas comerciais

- Criação de propostas comerciais a partir dos dados do cliente/oportunidade.
- Cadastro de produtos, serviços, quantidades, valores, descontos e condições comerciais.
- Geração de proposta em formato adequado para visualização, impressão e PDF.
- Associação da proposta à oportunidade e ao histórico do cliente.
- Controle básico de status da proposta, como rascunho, enviada, aceita ou recusada.

## E-mail e cadência comercial

- Envio de e-mails diretamente pelo CRM.
- Criação de cadências de prospecção e follow-up.
- Programação de contatos futuros.
- Templates de e-mail reutilizáveis.
- Registro dos e-mails enviados no histórico do lead/prospect/cliente.
- Utilização das interações para apoiar a captura, qualificação e evolução dos leads.
- Arquitetura preparada para futuras integrações com IA, permitindo automações e análise das interações.

## Princípios do sistema

- Simplicidade.
- Interface moderna e intuitiva.
- Baixa complexidade operacional.
- Fácil manutenção e evolução.
- Arquitetura modular.
- Preparação para integração com IA/ML e automações.
- Containerização completa da infraestrutura.
- Reutilização, sempre que possível, dos padrões arquiteturais já utilizados no ProAgentHub e da identidade visual do Vision.AI.