# Spec — Central administrativa e control plane

## 1. Objetivo

Definir o painel administrativo do Blog do Carro como uma superfície única para conteúdo, home, menu, loja, pedidos, analytics, conexões e segurança, preservando três fronteiras:

1. o CMS persiste artigos, produtos, composição da home e menu no D1; as demais ações continuam sem efeito externo;
2. a implementação real autoriza toda ação no servidor;
3. valores de credenciais nunca entram no painel, no D1, no HTML ou no bundle do navegador.

## 2. Resultado para a pessoa administradora

Uma pessoa sem conhecimento técnico deve conseguir entender:

- o que está publicado, em revisão ou aguardando decisão;
- como um vídeo do YouTube vira artigo e destaque da home;
- quais produtos e pedidos exigem atenção;
- quais conexões estão ausentes, em sandbox, saudáveis ou ativas;
- por que determinada capacidade ainda não pode ser ligada;
- quais ações foram realizadas e por quem.

O painel deve parecer uma central operacional do Blog do Carro, não um tema de dashboard genérico.

## 3. Estado atual

- rotas administrativas completas e responsivas;
- CMS com leitura e escrita D1 para artigos, catálogo, home e menu;
- projeção pública separada das revisões administrativas;
- catálogo demonstrativo com chaveiro a `R$ 9,90` e miniatura `coming_soon`;
- conectores externos, pedidos, pagamento e frete permanecem simulados ou desligados;
- fronteira de autorização server-side com SIWC, owner e negação por padrão;
- `noindex`, `nofollow`, `private, no-store` e bloqueio de frame;
- identidade sintética somente por HTTP em loopback; host publicado exige SIWC e owner configurado.

## 4. Fora do escopo atual

- OAuth, cookie administrativo paralelo ou cadastro de administrador mantido pela aplicação;
- publicação pública de mídia R2 antes da homologação;
- segredo, token, senha, chave de API ou credencial;
- chamada para YouTube, Resend, Mercado Livre, Mercado Pago ou Meu Envio;
- cobrança, webhook, etiqueta, rastreio ou pedido real;
- analytics ou dados de visitante reais;
- alteração do conteúdo público.

## 5. Mapa de rotas

| Rota | Missão principal | Fonte atual |
| --- | --- | --- |
| `/admin` | resumo operacional e próximos gates | D1 e estados server-side |
| `/admin/analytics` | leitura de aquisição, conteúdo, dispositivo e loja | números ilustrativos |
| `/admin/artigos` | fila editorial e estados | D1 editorial |
| `/admin/artigos/novo` | criar artigo completo a partir de vídeo | revisão D1 |
| `/admin/home` | ordenar seções e revisar o hero | curadoria D1 |
| `/admin/menu` | exibir ou ocultar itens | curadoria D1 |
| `/admin/loja/produtos` | adicionar e arquivar itens | catálogo D1 demonstrativo |
| `/admin/loja/configuracoes` | identidade e regras públicas da loja | configuração D1 demonstrativa |
| `/admin/pedidos` | fila e detalhe sintético | fixtures `DEMO-*` |
| `/admin/integracoes` | requisitos, estados, rotas e gates dos conectores | contratos tipados |
| `/admin/seguranca` | papéis, fronteira e auditoria | fixtures de segurança |

### 5.1 Arquitetura-alvo

```mermaid
flowchart LR
  Admin["Painel /admin"] --> Boundary["Fronteira administrativa"]
  Boundary --> Auth["Sites/ChatGPT SIWC + allowlist + RBAC"]
  Auth --> Content["Conteúdo e home"]
  Auth --> Commerce["Produtos e pedidos"]
  Auth --> Control["Control plane de conexões"]
  Content --> Published["Projeção publicada"]
  Published --> Portal["Portal público"]
  Content --> Repository["Interface de repositório editorial"]
  Repository --> EditorialStore["D1 · fonte editorial única"]
  Commerce --> D1
  Content --> R2["R2 · mídia staged até homologação"]
  Control --> Adapters["Adapters server-side"]
  Secrets["Secrets do Sites"] -. "estado, nunca valor" .-> Control
  Secrets --> Adapters
  Adapters --> External["YouTube, Resend, pagamento e frete"]
  Auth --> Audit["Audit log append-only"]
  Customer["Conta do cliente"] --> Orders["Meus pedidos"]
  Orders --> Commerce
```

O painel publicado usa D1 e a fronteira de autorização do Sites. R2 continua limitado a mídia staged até homologação; adapters e serviços externos permanecem inativos.

## 6. Princípios de experiência

- mobile-first para 360–430 px e navegação confortável com uma mão;
- uma ação principal por contexto;
- informação operacional antes de decoração;
- estado sempre expresso por texto e forma, nunca somente cor;
- ações críticas futuras recebem revisão, confirmação, reautenticação e rollback;
- páginas densas usam listas, filas e timelines antes de tabelas;
- desktop expande a mesma arquitetura em uma barra lateral persistente;
- motion discreto e compatível com `prefers-reduced-motion`.

## 7. Modelo de artigo futuro

O editor real exige:

- `title`, `subtitle`, `slug`, `seoDescription`;
- imagem principal, dimensões, origem e texto alternativo;
- categoria, autor, data, tempo de leitura e relacionados;
- documento versionado com blocos `paragraph | heading | image`;
- bloco `Minha opinião`;
- `youtubeVideoId` e metadados de origem;
- FAQ estruturado;
- estado `draft | review | scheduled | published | archived`;
- data de agendamento e revisão atual;
- histórico de versões e audit events.

Regra estrutural: o domínio editorial acessa D1 por uma interface de repositório server-side. Rotas públicas consomem uma projeção somente de artigos publicados e nunca importam a coleção administrativa crua.

O editor permite inserir imagens entre blocos, mas salva referências de mídia, texto alternativo e legenda — nunca HTML livre nem URLs administrativas. Consulte `structured-editor-media.md`.

## 8. Fluxo vídeo → artigo → home

1. O conector detecta um vídeo novo e cria um rascunho idempotente pelo ID do YouTube.
2. O editor confirma origem, frame, recorte mobile e texto alternativo.
3. Preenche título editorial, pergunta, subtítulo, corpo, opinião, FAQ e SEO.
4. Salva rascunho ou envia para revisão.
5. Um publicador revisa as diferenças e agenda ou publica.
6. A publicação gera audit event e revalida a projeção pública.
7. A home recebe o item de acordo com a curadoria; upload não publica sozinho.

## 9. Fluxo de produto e pedido

1. A operação cria ou edita um produto sem ativar venda.
2. Produto exige SKU, preço em centavos, imagens, estoque, políticas e estado.
3. Ativação comercial depende de pagamento, frete, privacidade e suporte homologados.
4. Pedido real nasce no servidor com snapshots imutáveis de preço e item.
5. Pagamento, atendimento e envio usam estados separados.
6. Mudança de estado válida gera evento append-only.
7. Cliente vê somente a projeção segura definida em `customer-order-portal.md`.

## 10. Estados de conector

O painel real não usa um único rótulo ambíguo. Mantém quatro dimensões:

| Dimensão | Valores iniciais |
| --- | --- |
| modo permitido | `disabled | sandbox | live` |
| configuração | `missing | configured | invalid` |
| saúde | `unknown | healthy | degraded | failing` |
| ativação | `inactive | pending_approval | active | suspended` |

A capacidade efetiva exige, ao mesmo tempo:

```text
código presente
AND ambiente permitido
AND configuração válida
AND adapter saudável
AND flag server-side ativa
AND usuário autorizado
```

O navegador nunca determina se uma capacidade está ativa.

## 11. Gestão de secrets

### O painel pode mostrar

- nome lógico, como `RESEND_API_KEY`;
- ambiente;
- `configurado` ou `não configurado`;
- data da última rotação;
- fingerprint não reversível quando o provedor permitir;
- resultado sanitizado do último health check.

### O painel nunca mostra ou recebe

- valor atual ou anterior;
- senha, token, cookie, chave privada ou payload de webhook;
- campo que sugira colar secret no primeiro control plane;
- botão capaz de devolver credencial ao navegador.

Inserção e rotação pertencem ao mecanismo de secrets do Sites. D1 guarda somente metadados operacionais e referência lógica.

## 12. Autenticação administrativa

- identidade administrativa gerenciada por Sites/ChatGPT SIWC, sem senha própria no D1;
- proteção de `/admin/*` e `/api/admin/*` antes do handler público;
- leitura server-side de `oai-authenticated-user-id` como identificador estável;
- bootstrap temporário por e-mail desligado; IDs estáveis provisionados fora do Git são a base da autorização;
- sessão SIWC gerenciada pelo Sites, sem cookie administrativo paralelo nesta fase;
- negação por padrão;
- primeiro owner provisionado exclusivamente no servidor, fora do código e do Git;
- remover usuário ou papel revoga o acesso na requisição seguinte;
- cada API, Server Action e repositório repete a autorização necessária.
- mutações administrativas exigem `Origin` de mesma origem na fronteira do Worker;
- nenhum ID ou e-mail administrativo é documentado ou versionado;
- um preview publicado deve provar proteção contra headers de identidade forjados e acesso direto ao Worker antes da ativação de dados reais.

A identidade do cliente nunca concede acesso ao admin e a identidade do admin nunca substitui a sessão do cliente.

## 13. RBAC inicial

Permissões são verificadas no servidor:

- `content.read | write | review | publish`;
- `home.read | write | publish`;
- `catalog.read | write | activate`;
- `orders.read | update`;
- `customer_pii.read`;
- `analytics.read`;
- `connectors.read | test | activate`;
- `flags.read | change`;
- `admin_users.manage`;
- `audit.read`.

Papéis de partida: `owner`, `editor`, `publisher`, `commerce_operator`, `support`, `analyst` e `integrations_admin`.

## 14. Audit log

Eventos administrativos registram:

- ID, timestamp, request ID e sessão;
- ator e permissão usada;
- ação, recurso e ambiente;
- resultado `allowed | denied | failed`;
- estado anterior e posterior sanitizados;
- motivo obrigatório para ações sensíveis.

O log é append-only para a aplicação. Nunca registra secret, token, cookie, payload integral, endereço ou e-mail completo. Revelação excepcional de PII também gera evento.

## 15. Analytics

Eventos permitidos:

- visualização de página e artigo;
- início do vídeo;
- busca;
- produto visto;
- início do checkout;
- newsletter após consentimento.

Regras:

- sem IP persistido;
- sem parâmetro de autenticação, pedido ou token;
- agregação diária separada do tráfego público;
- dados administrativos e de clientes não entram nos eventos de conteúdo;
- números do mock são sempre rotulados como ilustrativos.

## 16. Dados futuros

Domínios separados:

- editorial: artigos, revisões, autores, categorias, FAQs, menus e home;
- administração: usuários, papéis, sessões, flags e auditoria;
- loja: produtos, variantes, estoque e configurações;
- comércio: clientes, pedidos, itens, pagamentos, envios e webhooks;
- analytics: eventos com retenção curta e agregados diários.

O ADR 0001 define o CMS interno com D1 como fonte editorial única, isolada por interface de repositório e projeção publicada. D1 e CRUD editorial estão ativos; R2 recebe somente mídia staged até homologação do ciclo público.

## 17. Segurança operacional

- HTTP em loopback recebe identidade sintética apenas para desenvolvimento;
- host publicado sem configuração falha fechado; identidade ausente, desconhecida ou sem permissão não acessa o admin;
- mutações administrativas exigem `Origin` de mesma origem;
- resposta administrativa usa `private, no-store`;
- `X-Frame-Options: DENY` e `Referrer-Policy: no-referrer`;
- metadata `noindex,nofollow` e `Disallow: /admin/`;
- nenhuma gravação em `localStorage` ou `sessionStorage`;
- nenhuma chamada para host externo;
- nenhuma credencial no formulário;
- escritas passam por autorização e auditoria no servidor.

Esses controles protegem o CMS publicado, mas não autorizam conectores, comércio real ou entrega pública de mídia sem homologação própria.

## 18. Critérios de aceite da superfície administrativa

- todas as rotas da matriz respondem em host local;
- navegação pública não aparece dentro do admin;
- desktop e mobile compartilham os mesmos destinos;
- aviso de demonstração aparece nas áreas comerciais ainda simuladas;
- editar, ordenar, ativar ou arquivar persiste somente nos domínios D1 aprovados;
- integrações nunca solicitam valor secreto;
- pedidos usam apenas `DEMO-*` e não leem dados do checkout;
- ações informam claramente o efeito simulado;
- admin não aparece no sitemap e é desautorizado no robots;
- host publicado sem owner configurado falha fechado e mutação cross-origin é recusada;
- reload preserva alterações autorizadas do CMS;
- lint, TypeScript, build, testes de renderização e QA de navegador passam.

## 19. Critérios de aceite da versão real

- toda rota HTML e API administrativa é protegida no servidor;
- testes negativos provam `deny by default` por permissão;
- cliente e admin não compartilham cookie, tabela de sessão ou autorização;
- nenhum secret aparece em HTML, JSON, D1, bundle, erro ou log;
- preview e produção usam contas, bindings, dados e secrets separados;
- ativação live falha com secret ausente, health falho ou sessão antiga;
- publicação, mudança de papel, flag, conector e pedido geram audit event;
- operações críticas são idempotentes;
- rollback desativa superfícies sem apagar evidências;
- política de privacidade, retenção e suporte está aprovada.

## 20. Sequência recomendada

1. concluir a rodada editorial e registrar regressões;
2. implementar o documento de blocos e a migration aditiva por revisão;
3. homologar uploads R2, renderer compartilhado e rollback;
4. ativar mídia pública gradualmente por flag;
5. implementar analytics first-party agregado;
6. homologar conectores um por vez;
7. ativar comércio somente após produto, políticas e operação reais.
