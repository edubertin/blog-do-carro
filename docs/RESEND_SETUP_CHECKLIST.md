# Resend — ponto de retomada

## Estado pausado

- Conta e equipe separadas para o Blog do Carro.
- Domínio cadastrado: `blogdocarro.com`.
- Região de envio: São Paulo.
- Envio habilitado no domínio; recebimento não será usado neste corte.
- Topics públicos criados: `Artigos e novidades` e `Loja da Comunidade`.
- Segmentos criados: `Newsletter editorial` e `Interesse na Loja`.
- Página de cancelamento configurada com preto `#0D0D0D`, branco e amarelo `#F4B400`.
- Nenhuma API key foi criada ou armazenada.
- Nenhum webhook foi criado.
- Flags de captação e envio permanecem desligadas.

## Quando o DNS estiver disponível

1. Abrir o domínio `blogdocarro.com` no painel do Resend.
2. Copiar do painel os valores atuais de DKIM, SPF e MX para o provedor DNS. O valor DKIM gerado não deve ser salvo neste repositório.
3. Publicar DMARC inicialmente em modo de observação: `v=DMARC1; p=none;`.
4. Aguardar o estado `Verified` no Resend e validar SPF, DKIM e DMARC.
5. Criar remetentes coerentes com o domínio:
   - `novidades@blogdocarro.com` para newsletter;
   - `loja@blogdocarro.com` para interesse da loja;
   - `acesso@blogdocarro.com` para autenticação;
   - `contato@blogdocarro.com` como endereço humano de resposta.
6. Criar uma API key exclusiva do projeto, com o menor escopo disponível, e salvar somente como secret do Sites.
7. Criar o webhook apenas depois de a rota pública assinada existir; salvar seu secret somente no Sites.
8. Habilitar MFA na conta Resend antes da homologação.

## Catálogo preparado

- Confirmação da newsletter editorial — double opt-in, validade de 24 horas.
- Confirmação de interesse na Loja da Comunidade — double opt-in separado, validade de 24 horas.
- Magic link de acesso do cliente — transacional, validade de 5 minutos; fica apenas em preview até a área de pedidos existir.

Os previews ficam em `/admin/emails`. Eles usam fixtures, não enviam mensagens e não contêm destinatários ou tokens reais.

## Gates antes de ligar as flags

- Gmail web/mobile e Outlook web/desktop aprovados.
- Texto simples e HTML equivalentes.
- Link intermediário, expiração, uso único, replay e scanners testados.
- Idempotência persistente implementada para retries.
- Turnstile, limites de abuso e política de privacidade publicados.
- `AUDIENCE_CAPTURE_ENABLED` e `RESEND_SEND_ENABLED` ligados primeiro em preview.
