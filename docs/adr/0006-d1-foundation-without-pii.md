# ADR 0006 — Fundação D1 sem dados pessoais

- Status: **aceita**
- Data: **2026-08-06**

## Contexto

O CMS interno, a loja demonstrativa e o control plane precisam de um modelo persistente antes da criação do binding D1. Ao mesmo tempo, autenticação de clientes, pagamento, frete e retenção de dados pessoais ainda dependem de decisões e homologações próprias.

Criar todas as tabelas futuras no primeiro migration confundiria preparação arquitetural com ativação comercial e poderia fixar prematuramente o schema do Better Auth ou a estratégia de proteção de PII.

## Decisão

O primeiro migration versionado cobre apenas:

- identidade e revisões editoriais;
- vídeos de origem e categorias;
- projeção pública separada de conteúdo publicado;
- menus e composição da home;
- produtos, variantes e ledger de estoque;
- configuração operacional de conectores sem valores secretos;
- principals administrativos identificados futuramente por HMAC, atribuições de papel, idempotência e auditoria append-only.

O seed local contém somente categorias, metadados públicos dos quatro vídeos já usados no portal, um rascunho editorial existente, o Chaveiro Presente em modo `preview`, estoque não rastreado e conectores inativos. Ele não contém owner, e-mail, endereço, pedido, sessão, pagamento, token ou credencial.

O binding D1 permanece `null`. O portal público continua usando as fixtures atuais e nenhuma mutação administrativa passa a persistir nesta etapa.

## Fronteiras

- As tabelas do Better Auth serão geradas somente depois do spike de compatibilidade com Vinext, Worker, D1 e cookies.
- Clientes, endereços, pedidos, detalhes privados, pagamentos, envios e webhooks entram em migration posterior.
- Antes de qualquer PII real, outro ADR decide se comércio ficará no mesmo D1 físico ou em banco separado por ambiente.
- Identidade e sessão SIWC continuam sob responsabilidade do Sites; D1 nunca armazena senha ou token administrativo.
- Papéis e permissões permanecem definidos em TypeScript; D1 guarda apenas atribuições futuras.

## Consequências

- O schema editorial e de catálogo pode ser testado localmente sem recurso externo.
- A publicação deverá gravar revisão, projeção pública e audit event no mesmo batch D1.
- Rotas públicas consultarão exclusivamente a projeção publicada depois da ativação.
- O comércio demonstrativo não vira pedido nem reserva de estoque.
- Provisionar o binding, aplicar migrations ou mudar dados de preview/produção continua exigindo autorização explícita.
