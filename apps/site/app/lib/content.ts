export type Article = {
  slug: string;
  category: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  publishedAt?: string;
  updatedAt?: string;
  readTime: string;
  image: string;
  imageAlt: string;
  videoId?: string;
  body: readonly string[];
  opinion: string;
  faq: readonly { question: string; answer: string }[];
};

export type ArticleStatus = "draft" | "review" | "scheduled" | "published" | "archived";

export type EditorialArticleRecord = Readonly<Article & {
  status: ArticleStatus;
}>;

export type FeaturedVideo = {
  id: string;
  sourceTitle: string;
  editorialTitle: string;
  question: string;
  views: string;
  image: string;
  articleSlug: string;
};

export const categories = [
  "Compra e Venda",
  "Negociações",
  "SUV",
  "Sedan",
  "Hatch",
  "Picapes",
  "Comparativos",
  "Problemas Crônicos",
  "Dicas",
  "Mercado Automotivo",
] as const;

export const categoryGroups = [
  {
    index: "01",
    title: "Comprar e negociar",
    description: "Preço, proposta, troca e leitura do mercado.",
    items: ["Compra e Venda", "Negociações", "Mercado Automotivo"],
  },
  {
    index: "02",
    title: "Escolher o carro certo",
    description: "Modelos, carrocerias e comparações sem enrolação.",
    items: ["SUV", "Sedan", "Hatch", "Picapes", "Comparativos"],
  },
  {
    index: "03",
    title: "Cuidar e evitar prejuízo",
    description: "Problemas conhecidos e decisões de manutenção.",
    items: ["Problemas Crônicos", "Dicas"],
  },
] as const;

const featuredVideoRecords: readonly FeaturedVideo[] = [
  {
    id: "jT0j_rCgbbc",
    sourceTitle: "Esse senhor trocou sua moto numa Spin e financiou o restante",
    editorialTitle: "Moto por uma Spin financiada",
    question: "Foi um bom negócio ou a parcela esconde o custo real?",
    views: "28 mil visualizações",
    image: "/images/videos/spin-financiada-frame-source.png",
    articleSlug: "moto-por-spin-financiada-bom-negocio",
  },
  {
    id: "E1mywkvsMEk",
    sourceTitle: "Esse foi um negócio de gente grande",
    editorialTitle: "Negócio de gente grande",
    question: "O que faz uma troca grande realmente valer a pena?",
    views: "52 mil visualizações",
    image: "/images/videos/negocio-gente-grande-frame-source.png",
    articleSlug: "negocio-de-gente-grande-troca-de-carros",
  },
  {
    id: "pBwSpjFqNYk",
    sourceTitle: "Tentaram trocar uma Spin de leilão em uma Saveiro e um Gol",
    editorialTitle: "Spin de leilão na troca",
    question: "Quem assume o risco quando o histórico entra no negócio?",
    views: "174 mil visualizações",
    image: "/images/videos/spin-leilao-frame-source.png",
    articleSlug: "spin-de-leilao-na-troca-riscos",
  },
  {
    id: "6Ad2yXex_oc",
    sourceTitle: "Ônix por um Nissan Versa com sinistro",
    editorialTitle: "Ônix por Versa com sinistro",
    question: "Economia de verdade ou uma cilada na revenda?",
    views: "204 mil visualizações",
    image: "/images/videos/onix-versa-frame-source.png",
    articleSlug: "onix-por-versa-com-sinistro",
  },
];

const publicEditorialRecords = [
  {
    status: "published",
    slug: "moto-por-spin-financiada-bom-negocio",
    category: "Negociações",
    title: "Trocar uma moto por uma Spin financiada: foi bom negócio?",
    subtitle: "O vídeo diverte, mas a conta pede atenção: entrada, prazo, juros e custo de uso mudam completamente o resultado da troca.",
    dateLabel: "VÍDEO NOVO",
    readTime: "6 MIN",
    image: "/images/videos/spin-financiada-frame-source.png",
    imageAlt: "Frame do vídeo sobre a troca de uma moto por uma Chevrolet Spin",
    videoId: "jT0j_rCgbbc",
    body: [
      "Trocar uma moto por um carro familiar resolve uma necessidade real de espaço, conforto e proteção. O problema começa quando a negociação é avaliada apenas pela parcela que cabe no mês.",
      "Para saber se a troca faz sentido, some o valor entregue na moto, o total financiado, juros, seguro, combustível e manutenção provável. Uma parcela confortável pode esconder um custo final muito acima do valor do veículo.",
      "Também vale conferir versão, quilometragem, histórico e laudo da Spin. A decisão fica mais segura quando o comprador conhece o custo total antes de comemorar a aprovação do crédito.",
    ],
    opinion: "Se a Spin resolve a vida da família, a troca pode fazer sentido. Mas o bom negócio só aparece depois de olhar o valor total, não apenas a parcela.",
    faq: [
      { question: "O que comparar antes de financiar a diferença?", answer: "Valor total financiado, CET, prazo, seguro, consumo e manutenção do carro que entra na troca." },
      { question: "Uma parcela menor significa melhor negócio?", answer: "Não necessariamente. Prazos longos reduzem a parcela e podem elevar bastante o total pago." },
    ],
  },
  {
    status: "published",
    slug: "negocio-de-gente-grande-troca-de-carros",
    category: "Negociações",
    title: "Negócio de gente grande: como avaliar uma troca de alto valor",
    subtitle: "Quanto maior o valor dos veículos, mais importantes ficam procedência, liquidez e custo total da operação.",
    dateLabel: "RECENTE",
    readTime: "5 MIN",
    image: "/images/videos/negocio-gente-grande-frame-source.png",
    imageAlt: "Frame do vídeo comparando utilitário esportivo e picape",
    videoId: "E1mywkvsMEk",
    body: [
      "Negociações de alto valor amplificam qualquer diferença de avaliação. Uma margem percentual aparentemente pequena pode representar dezenas de milhares de reais.",
      "Além do preço, compare liquidez, seguro, manutenção, tributação e facilidade de revenda. A proposta precisa mostrar com clareza quanto vale cada veículo e qual é o custo da diferença.",
    ],
    opinion: "Em uma troca grande, pressa custa caro. Laudo independente e proposta discriminada são o mínimo para decidir com segurança.",
    faq: [
      { question: "Por que pedir uma proposta discriminada?", answer: "Ela separa avaliação, diferença, taxas e financiamento, evitando que um desconto esconda custo em outra linha." },
    ],
  },
  {
    status: "published",
    slug: "spin-de-leilao-na-troca-riscos",
    category: "Compra e Venda",
    title: "Spin de leilão na troca: quem realmente assume o risco?",
    subtitle: "Histórico de leilão pode afetar preço, seguro e revenda; a origem e o tipo de ocorrência precisam aparecer antes da proposta.",
    dateLabel: "RECENTE",
    readTime: "7 MIN",
    image: "/images/videos/spin-leilao-frame-source.png",
    imageAlt: "Frame do vídeo sobre uma Chevrolet Spin com passagem por leilão",
    videoId: "pBwSpjFqNYk",
    body: [
      "Passagem por leilão não descreve sozinha o estado atual de um veículo. Existem origens diferentes, e cada uma muda o risco, a aceitação do seguro e a futura revenda.",
      "Antes de aceitar o carro, consulte histórico, documentação, laudo cautelar e seguradora. O desconto deve compensar de forma real a menor liquidez e as possíveis restrições.",
    ],
    opinion: "Carro de leilão não deve ser tratado como carro comum. Transparência e desconto compatível precisam fazer parte do negócio desde o início.",
    faq: [
      { question: "Todo carro de leilão é igual?", answer: "Não. A origem do leilão e a extensão dos danos fazem grande diferença na avaliação." },
      { question: "É possível fazer seguro?", answer: "Depende da seguradora, do histórico e da vistoria. Confirme a aceitação antes da compra." },
    ],
  },
  {
    status: "published",
    slug: "onix-por-versa-com-sinistro",
    category: "Compra e Venda",
    title: "Ônix por Versa com sinistro: economia ou cilada?",
    subtitle: "Os comentários levantaram a pergunta certa: quanto o histórico deve reduzir o preço e como isso afeta a próxima troca?",
    dateLabel: "RECENTE",
    readTime: "6 MIN",
    image: "/images/videos/onix-versa-frame-source.png",
    imageAlt: "Frame do vídeo comparando Chevrolet Onix e Nissan Versa",
    videoId: "6Ad2yXex_oc",
    body: [
      "Um veículo com sinistro ou passagem por leilão precisa ser comparado com exemplares de histórico semelhante, não apenas com a referência de um carro sem ocorrência.",
      "A discussão da comunidade aponta para três dúvidas práticas: valor acima da referência, desconto na futura revenda e clareza sobre o histórico antes da assinatura.",
      "Laudo cautelar, consulta de histórico, cotação de seguro e avaliação de mercado formam um conjunto. Nenhum desses itens deve ser substituído por confiança verbal na negociação.",
    ],
    opinion: "O preço precisa refletir o histórico. Se a próxima revenda terá desconto, o comprador deve receber essa compensação agora.",
    faq: [
      { question: "Tabela FIPE considera passagem por leilão?", answer: "A referência é uma média de mercado e não substitui a avaliação do histórico e do estado do veículo específico." },
      { question: "O laudo cautelar elimina o risco?", answer: "Ele reduz incertezas, mas deve ser combinado com documentação, inspeção mecânica e cotação de seguro." },
    ],
  },
  {
    status: "published",
    slug: "detalhe-que-muda-valor-carro-na-troca",
    category: "Negociações",
    title: "O detalhe que muda o valor do seu carro na troca",
    subtitle:
      "Uma preparação simples pode mudar a primeira impressão da loja e abrir espaço para uma proposta melhor.",
    dateLabel: "6 AGO 2026",
    publishedAt: "2026-08-06",
    readTime: "7 MIN",
    image: "/images/articles/hero-negociacoes.png",
    imageAlt: "Sedã prata em uma garagem de concreto ao entardecer",
    body: [
      "Na avaliação de um usado, o estado geral pesa antes mesmo de o avaliador ligar o motor. Pintura uniforme, interior limpo e histórico organizado ajudam a mostrar que o carro recebeu cuidado ao longo do tempo.",
      "Isso não significa esconder defeitos. Transparência sobre revisões, reparos e pequenos detalhes cria confiança e reduz o risco percebido por quem vai comprar ou revender o veículo.",
      "Antes de negociar, reúna manual, chave reserva, notas de manutenção e comprovantes. Compare anúncios equivalentes e defina três números: o valor ideal, o valor justo e o limite abaixo do qual você prefere não fechar.",
    ],
    opinion:
      "O melhor argumento na troca não é um discurso: é um carro bem apresentado, com histórico claro e preço de referência na mão. Organização costuma valer mais do que acessórios improvisados.",
    faq: [
      {
        question: "Vale a pena fazer uma revisão antes da troca?",
        answer:
          "Sim, quando ela resolve itens de manutenção previsível e gera comprovantes. Reparos caros devem ser avaliados caso a caso.",
      },
      {
        question: "Lavagem detalhada aumenta o valor?",
        answer:
          "Ela melhora a percepção e facilita a avaliação, mas não substitui histórico, mecânica em dia e documentação regular.",
      },
      {
        question: "Como saber se a proposta é justa?",
        answer:
          "Compare veículos semelhantes na sua região e considere a margem, os custos e a conveniência oferecida pela loja.",
      },
    ],
  },
  {
    status: "published",
    slug: "suvs-medios-mais-vendidos-julho-2026",
    category: "SUV",
    title: "SUVs médios: os modelos mais vendidos em julho de 2026",
    subtitle:
      "O ranking do mês ajuda a entender liquidez, procura e força de revenda entre os utilitários médios.",
    dateLabel: "5 AGO 2026",
    publishedAt: "2026-08-05",
    readTime: "5 MIN",
    image: "/images/articles/suv-julho-2026.png",
    imageAlt: "SUV branco em movimento por uma estrada arborizada",
    body: [
      "O segmento de SUVs médios continua concentrando compradores que procuram espaço familiar, posição de dirigir alta e boa liquidez na revenda.",
      "Mais do que observar o ranking, vale comparar seguro, consumo, revisões e disponibilidade de peças. O modelo mais vendido nem sempre será o melhor negócio para todos os perfis.",
    ],
    opinion:
      "Volume de vendas é um sinal importante, mas custo total e histórico de confiabilidade ainda devem decidir a compra.",
    faq: [
      {
        question: "O SUV mais vendido é sempre o que menos desvaloriza?",
        answer: "Não. Versão, conservação, procura regional e custos de uso também influenciam a revenda.",
      },
    ],
  },
  {
    status: "published",
    slug: "combustiveis-precos-agosto-2026",
    category: "Mercado Automotivo",
    title: "Combustíveis: o que muda nos preços em agosto",
    subtitle:
      "Entenda os fatores que chegam às bombas e como acompanhar o custo real por quilômetro.",
    dateLabel: "4 AGO 2026",
    publishedAt: "2026-08-04",
    readTime: "4 MIN",
    image: "/images/articles/combustiveis-agosto-2026.png",
    imageAlt: "Motorista abastecendo um carro em posto contemporâneo",
    body: [
      "O preço final depende de uma cadeia que envolve produção, distribuição, impostos e concorrência local. Por isso, alterações anunciadas nem sempre aparecem imediatamente em todos os postos.",
      "Para comparar gasolina e etanol, acompanhe o consumo real do seu carro. A relação de preços é um ponto de partida, não uma regra universal.",
    ],
    opinion:
      "Anote abastecimentos por algumas semanas. O custo por quilômetro do seu próprio carro é mais útil do que qualquer fórmula genérica.",
    faq: [
      {
        question: "Etanol compensa quando custa 70% da gasolina?",
        answer: "A proporção varia conforme a eficiência do veículo. Use seus consumos médios para decidir.",
      },
    ],
  },
] satisfies readonly EditorialArticleRecord[];

export function selectPublishedArticles(records: readonly EditorialArticleRecord[]): readonly Article[] {
  return records.flatMap(({ status, ...article }) => status === "published" ? [article] : []);
}

export function findPublishedArticleIn(records: readonly EditorialArticleRecord[], slug: string): Article | undefined {
  return selectPublishedArticles(records).find((article) => article.slug === slug);
}

export const publishedArticles = selectPublishedArticles(publicEditorialRecords);
export const articles = publishedArticles;

const publishedArticleSlugs = new Set(publishedArticles.map((article) => article.slug));
export const featuredVideos = featuredVideoRecords.filter((video) => publishedArticleSlugs.has(video.articleSlug));

export const primaryArticle = publishedArticles[0];

export function findPublishedArticle(slug: string): Article | undefined {
  return publishedArticles.find((article) => article.slug === slug);
}

export function slugifyCategory(category: string): string {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
