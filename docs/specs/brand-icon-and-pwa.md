# Spec — Símbolo reduzido e preparação para PWA

## Decisão

A arte `BDC` aprovada é o símbolo reduzido oficial do Blog do Carro. Ela complementa o logotipo horizontal e não o substitui em contextos nos quais o nome completo da marca precisa ser reconhecido.

O arquivo mestre usado pelo produto é `apps/site/public/brand/blog-do-carro-icon.png`, quadrado, com 1254 × 1254 pixels. A cópia versionada deve permanecer visual e binariamente fiel ao original aprovado.

## Papéis dos ativos

| Ativo | Uso principal |
| --- | --- |
| logotipo horizontal | cabeçalho, rodapé, assinatura editorial e superfícies com espaço para o nome completo |
| símbolo `BDC` | favicon, atalho, tela inicial, avatar, compartilhamento compacto e futura instalação PWA |

Em interfaces muito estreitas, o símbolo pode substituir o logotipo horizontal apenas quando existir contexto textual ou acessível suficiente para identificar “Blog do Carro”.

## Regras visuais

- preservar fundo preto, contorno amarelo, silhueta do automóvel e monograma branco/amarelo;
- não recolorir, inclinar, comprimir, esticar, recortar ou aplicar efeitos;
- manter a proporção quadrada e a área de respiro existente;
- quando o símbolo estiver sozinho, o nome acessível é `Blog do Carro`;
- quando estiver ao lado do nome escrito, a imagem pode ser decorativa para evitar leitura duplicada.

## Estado atual

- o símbolo está ligado aos metadados de ícone, atalho e Apple Web App;
- o manifesto web usa `BDC` como nome curto e a cor `#0D0D0D` como tema;
- não existe service worker, cache offline, prompt de instalação ou promessa de funcionamento sem conexão;
- a experiência continua sendo um site responsivo mobile-first.

## Ativação futura da PWA

Antes de declarar o portal como PWA pronta, produzir variantes dedicadas de 192 × 192, 512 × 512 e Apple Touch de 180 × 180 pixels. Uma variante `maskable` deve ser validada separadamente para preservar carro, monograma e borda dentro da zona segura dos launchers.

O release PWA também exige:

1. estratégia de atualização e invalidação do service worker;
2. política de cache que não armazene admin, checkout, conta, pedidos ou respostas personalizadas;
3. tela offline honesta, sem simular dados atuais;
4. testes de instalação e atualização em Android, iOS e desktop;
5. auditoria de tamanho, contraste e legibilidade das variantes do ícone;
6. revisão de privacidade e telemetria antes de qualquer prompt de instalação.
