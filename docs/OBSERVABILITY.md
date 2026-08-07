# Observabilidade — Blog do Carro

## Estado atual

O protótipo não envia telemetria a terceiros. O worker gera um `X-Request-Id` por resposta, preserva apenas IDs recebidos em formato seguro e registra falhas inesperadas em JSON sem URL, query string, payload, e-mail, IP, token ou stack trace. Falhas inesperadas recebem resposta 500 sanitizada, sem cache e com o mesmo ID de correlação. A interface pública possui um limite de erro com recuperação local.

O painel de analytics continua usando fixtures explícitas. Ele não deve ser interpretado como medição real até existir uma fonte first-party aprovada.

## Contrato de eventos futuro

Eventos permitidos devem ser agregáveis e não conter dados pessoais:

- `page.viewed`: classe da rota, dispositivo agregado e origem sanitizada;
- `article.viewed`: identificador interno do artigo publicado;
- `video.started`: identificador interno do conteúdo, após ação explícita;
- `search.used`: quantidade de resultados, sem registrar o termo bruto;
- `product.viewed` e `checkout.started`: identificador interno do produto;
- `order.state_changed`: identificador opaco e transição de estado, somente no servidor.

IP, user-agent integral, e-mail, endereço, CPF, telefone, parâmetros de autenticação, conteúdo de formulário e valores de secrets são proibidos em eventos e logs.

## Gates para ativação

1. Aprovar fornecedor e contrato de tratamento de dados dentro do Sites.
2. Definir ambientes, retenção, amostragem, release e responsáveis por alertas.
3. Filtrar dados sensíveis na borda antes de qualquer exportação.
4. Testar falha do coletor sem degradar página, checkout ou publicação editorial.
5. Documentar acesso, rotação de credencial, exclusão e resposta a incidente.

Alertas iniciais devem cobrir taxa de erro 5xx, indisponibilidade de publicação, falha de login, rejeição de webhook, divergência de pagamento e regressão de Core Web Vitals mobile. Nenhum conector é ativado por este documento.
