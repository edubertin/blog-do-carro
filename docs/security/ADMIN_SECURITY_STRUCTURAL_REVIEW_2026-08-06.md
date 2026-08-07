# Revisão de segurança e estrutura — painel administrativo

Data: 2026-08-06
Escopo: mock local do painel, fronteira entre portal e administração, conectores futuros, conteúdo, loja e pedidos.

## Veredito

O painel está adequado para validação visual e de fluxo em ambiente local. Não existe conector real, persistência administrativa, cobrança, envio de e-mail, autenticação ou gravação de segredo. Em hostname não local, o worker responde `404` para `/admin`.

Não há vulnerabilidade P0 ativa no mock atual porque ele não expõe APIs administrativas nem dados reais. Publicar qualquer rota administrativa ou conector antes dos gates descritos abaixo criaria risco P0.

## Evidências verificadas

- Rotas administrativas cobertas por testes renderizados.
- `/admin` local recebe `noindex`, `no-store`, `X-Frame-Options: DENY`, CSP `frame-ancestors 'none'`, política de permissões restritiva, `Referrer-Policy: no-referrer` e `nosniff`.
- `/admin` em hostname público simulado responde `404`.
- O painel não possui campos para colar tokens, senhas ou chaves.
- A tela de conexões mostra somente nomes de variáveis, ambiente, modo, saúde e estado de ativação.
- Ações do mock usam estado React efêmero; `localStorage` e `sessionStorage` permanecem vazios.
- O preflight das conexões não chama serviços externos.
- Portal e painel usam árvores de layout e providers separadas.
- Playwright validou 390 × 844 e 1440 × 900 sem overflow horizontal, erros de console ou warnings.
- O drawer mobile prende o foco, fecha com `Escape`, devolve o foco ao acionador e torna o fundo inerte.
- `npm run ci` concluiu lint, TypeScript, build, 34 testes renderizados e auditoria de dependências com zero vulnerabilidades de produção.
- A suíte Playwright automatizada concluiu 12 cenários mobile/desktop, incluindo Axe, navegação, loja e bloqueio de host externo.
- Toda resposta recebe `X-Request-Id`; falhas inesperadas são registradas sem URL, query, dados pessoais ou stack trace.

## Correções realizadas nesta revisão

1. Separação da navegação e do rodapé públicos da árvore administrativa.
2. Bloqueio local-only de `/admin` no worker.
3. Cabeçalhos defensivos e exclusão do painel em `robots.txt`.
4. Remoção de dependência do carrinho e de armazenamento do navegador no painel.
5. Correção de hidratação em componentes de movimento.
6. Correção do seletor que ocultava a marca no cabeçalho mobile.
7. Tratamento de foco, `Escape`, scroll lock e fundo inerte no drawer.
8. Cobertura das rotas que faltavam nas specs: pedidos e segurança.
9. Validação obrigatória, seleção local de imagem e acesso de edição no fluxo de artigos.
10. Formulário demonstrativo de produto com nome, SKU, preço, estoque e imagem.
11. Seleção de pedidos com detalhe correlacionado e lista compacta de conexões no mobile.
12. Projeção tipada que impede rascunhos nas superfícies públicas.
13. Carregamento do YouTube somente após ação explícita do visitante.
14. Correção de contraste no admin e no breadcrumb detectada pelo Axe.
15. Fundação de observabilidade local com request ID e limite de erro.

## Gates P0 antes de qualquer publicação real

### Identidade e autorização

- Proteger `/admin/*` e `/api/admin/*` antes da aplicação, com negação por padrão.
- Separar identidade administrativa da conta de cliente.
- Aplicar RBAC no servidor; esconder botões no cliente não é autorização.
- Isolar cookies e sessões entre portal, cliente e administração.
- Cobrir acesso anônimo, sessão expirada, papel insuficiente e tentativa cross-tenant com testes negativos.

### Segredos e conectores

- Manter valores somente no mecanismo de secrets do Sites.
- Nunca devolver valores ao navegador, mesmo mascarados.
- Exibir no painel apenas `configured/not configured`, ambiente, fingerprint não reversível, rotação e saúde.
- Exigir quatro gates independentes: modo permitido, configuração válida, saúde válida e ativação server-side.
- Não reutilizar os booleanos atuais do mock como controles reais.

### Dados e auditoria

- Persistir pedidos e configurações no D1 somente após migrations e políticas aprovadas; conteúdo entra no D1 apenas se ele for escolhido como fonte editorial.
- Registrar alterações sensíveis em log append-only com ator, ação, recurso, ambiente e resultado.
- Separar desenvolvimento, preview e produção, inclusive dados, secrets e flags.

## Riscos estruturais ainda abertos

### P1 — resolver antes do backend administrativo

- Decidir entre CMS e D1 usando os critérios do ADR 0001; o CRUD editorial real continua bloqueado até essa escolha.
- Projetar uma borda única para APIs administrativas com autenticação, autorização, validação e auditoria.
- Definir permissões mínimas: proprietário, editor, operação da loja, leitura de analytics e suporte.

### P2 — acompanhar nas próximas fases

- A busca pública ainda importa o catálogo completo de artigos no cliente; trocar por índice ou endpoint quando o acervo crescer.
- Endurecer a inicialização do carrinho para evitar disputa de hidratação em dispositivos lentos.
- Aumentar alvos dos indicadores do carrossel para toque confortável.
- Otimizar imagens grandes e validar o serviço de imagens em preview do Sites.
- Reduzir arquivos legados extensos e remover gradualmente `allowJs` e `skipLibCheck`.

## Critério para promover o mock

O mock só pode deixar de ser local quando autenticação administrativa, RBAC server-side, auditoria, separação de ambientes, testes negativos e armazenamento seguro de secrets estiverem implementados e verificados em preview. Até lá, todas as integrações permanecem visualmente demonstrativas e operacionalmente inativas.

## Próxima fatia recomendada

Escolher a fonte editorial pelo ADR 0001 e, depois, implementar apenas a fronteira de autenticação administrativa e RBAC, ainda sem ativar Resend, Mercado Pago, frete, marketplace, D1 ou R2.
