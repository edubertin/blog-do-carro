# Política de segurança

## Versões suportadas

O desenvolvimento do Blog do Carro está pausado. A demonstração pública pode receber correções para vulnerabilidades críticas, exposição de dados, autenticação administrativa, publicação editorial ou entrega de mídia.

| Superfície | Status |
| --- | --- |
| Site público | Demonstração mantida |
| CMS administrativo | Acesso restrito pelo Sites/SIWC |
| Loja e checkout | Somente demonstração, sem cobrança |
| Newsletter e Resend | Desativados por flags |
| Contas e pedidos reais | Não implementados |

## Relatar uma vulnerabilidade

Use **Security → Report a vulnerability** no GitHub para abrir um [Private Vulnerability Report](https://github.com/Edubertin/blog-do-carro/security/advisories/new).

Não abra uma issue pública contendo tokens, cookies, chaves, credenciais, dados pessoais, payloads de pagamento, links de acesso ou detalhes suficientes para exploração ativa antes da correção.

Inclua no relato privado:

1. superfície e URL afetadas;
2. impacto observado;
3. passos mínimos de reprodução usando dados sintéticos;
4. evidência sanitizada;
5. mitigação sugerida, quando houver.

## Prioridades

- **Crítica:** cobrança real inesperada, acesso administrativo indevido, secret exposto ou leitura de dados privados.
- **Alta:** XSS persistente, bypass de autorização, mídia staged pública ou alteração editorial não autorizada.
- **Média:** abuso de recursos, enumeração, falha de rate limit ou cache incorreto sem exposição direta.
- **Baixa:** hardening, configuração defensiva ou informação sem caminho de exploração demonstrado.

## Expectativa de resposta

Como o projeto está pausado, não há SLA comercial. Relatos críticos e altos serão priorizados conforme disponibilidade. O recebimento será confirmado pelo canal privado antes de qualquer divulgação coordenada.

## Modelo de segurança

- secrets existem somente no ambiente server-side do Sites;
- D1 público consome projeções publicadas, nunca rascunhos;
- mídia R2 só se torna pública após publicação editorial;
- rotas administrativas exigem identidade e RBAC validados no servidor;
- mutações exigem mesma origem;
- integrações são desativadas por padrão e dependem de flags independentes;
- o checkout não processa pagamento, frete ou pedido persistente.

Veja também [`docs/security`](docs/security) e [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md).
