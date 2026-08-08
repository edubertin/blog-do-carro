export type MockStatus = "connected" | "managed" | "mock" | "planned" | "not_connected" | "blocked";

export type AdminConnector = Readonly<{
  id: string;
  name: string;
  area: string;
  summary: string;
  status: MockStatus;
  mode: "disabled" | "sandbox";
  configuration: "missing" | "fixture";
  health: "unknown" | "simulated";
  activation: "inactive" | "blocked";
  requiredSettings: readonly string[];
  requiredSecrets: readonly string[];
  relatedRoutes: readonly string[];
  nextStep: string;
}>;

export const statusLabels: Readonly<Record<MockStatus, string>> = {
  connected: "Ativo",
  managed: "Gerenciado no Sites",
  mock: "Mock local",
  planned: "Planejado",
  not_connected: "Não conectado",
  blocked: "Bloqueado",
};

export const adminConnectors: readonly AdminConnector[] = [
  {
    id: "youtube",
    name: "YouTube",
    area: "Conteúdo",
    summary: "Cria o rascunho editorial a partir de um vídeo novo do canal.",
    status: "mock",
    mode: "sandbox",
    configuration: "fixture",
    health: "simulated",
    activation: "inactive",
    requiredSettings: ["YOUTUBE_CHANNEL_ID"],
    requiredSecrets: ["YOUTUBE_API_KEY"],
    relatedRoutes: ["/admin/artigos/novo", "/admin/home"],
    nextStep: "Homologar a origem do vídeo, deduplicação e recorte do frame editorial.",
  },
  {
    id: "resend",
    name: "Resend",
    area: "E-mail",
    summary: "Entrega links de acesso e mensagens transacionais sem expor pedidos.",
    status: "planned",
    mode: "disabled",
    configuration: "missing",
    health: "unknown",
    activation: "blocked",
    requiredSettings: ["RESEND_FROM_EMAIL"],
    requiredSecrets: ["RESEND_API_KEY", "RESEND_WEBHOOK_SECRET"],
    relatedRoutes: ["/entrar", "/meus-pedidos"],
    nextStep: "Validar domínio, SPF, DKIM, DMARC e templates em ambiente protegido.",
  },
  {
    id: "customer-auth",
    name: "Acesso de clientes",
    area: "Identidade",
    summary: "Magic link separado da identidade administrativa para consultar pedidos.",
    status: "planned",
    mode: "disabled",
    configuration: "missing",
    health: "unknown",
    activation: "blocked",
    requiredSettings: ["BETTER_AUTH_URL", "CUSTOMER_ACCOUNTS_MODE", "ORDER_PORTAL_MODE"],
    requiredSecrets: ["BETTER_AUTH_SECRET"],
    relatedRoutes: ["/entrar", "/meus-pedidos"],
    nextStep: "Executar o spike de compatibilidade Vinext, D1, cookies e scanner de links.",
  },
  {
    id: "d1",
    name: "Cloudflare D1",
    area: "Dados",
    summary: "Fundação local pronta para conteúdo, catálogo e control plane; o binding ainda não foi criado.",
    status: "not_connected",
    mode: "disabled",
    configuration: "missing",
    health: "unknown",
    activation: "blocked",
    requiredSettings: ["D1 binding gerenciado pelo Sites"],
    requiredSecrets: [],
    relatedRoutes: ["/admin/*", "/meus-pedidos/*"],
    nextStep: "Revisar a migration em preview isolado e decidir a separação do futuro banco comercial antes de criar o binding.",
  },
  {
    id: "r2",
    name: "Cloudflare R2",
    area: "Mídia",
    summary: "Uploads editoriais próprios com validação de tipo, tamanho e acessibilidade.",
    status: "not_connected",
    mode: "disabled",
    configuration: "missing",
    health: "unknown",
    activation: "blocked",
    requiredSettings: ["R2 binding gerenciado pelo Sites"],
    requiredSecrets: [],
    relatedRoutes: ["/admin/artigos/novo", "/admin/loja/produtos"],
    nextStep: "Definir política de upload, retenção, variantes e texto alternativo.",
  },
  {
    id: "mercado-pago-pix",
    name: "Mercado Pago · Pix",
    area: "Pagamento",
    summary: "Pagamento futuro com idempotência, webhook assinado e reconciliação.",
    status: "not_connected",
    mode: "disabled",
    configuration: "missing",
    health: "unknown",
    activation: "blocked",
    requiredSettings: ["MERCADO_PAGO_ENVIRONMENT", "MERCADO_PAGO_WEBHOOK_URL"],
    requiredSecrets: ["MERCADO_PAGO_ACCESS_TOKEN", "MERCADO_PAGO_WEBHOOK_SECRET"],
    relatedRoutes: ["/checkout", "/admin/pedidos"],
    nextStep: "Homologar Pix, idempotência, assinatura do webhook e reconciliação em sandbox.",
  },
  {
    id: "meu-envio",
    name: "Meu Envio",
    area: "Logística",
    summary: "Cotação, etiqueta e rastreio futuros, isolados do fluxo editorial.",
    status: "not_connected",
    mode: "disabled",
    configuration: "missing",
    health: "unknown",
    activation: "blocked",
    requiredSettings: ["MEU_ENVIO_ORIGIN_POSTAL_CODE", "MEU_ENVIO_ENVIRONMENT"],
    requiredSecrets: ["MEU_ENVIO_API_TOKEN"],
    relatedRoutes: ["/checkout", "/admin/pedidos"],
    nextStep: "Definir origem, embalagem, política de frete e conta sandbox.",
  },
  {
    id: "mercado-livre",
    name: "Login Mercado Livre",
    area: "Identidade externa",
    summary: "Opção futura de identidade, sem conceder acesso administrativo.",
    status: "not_connected",
    mode: "disabled",
    configuration: "missing",
    health: "unknown",
    activation: "blocked",
    requiredSettings: ["MERCADO_LIVRE_REDIRECT_URI"],
    requiredSecrets: ["MERCADO_LIVRE_CLIENT_ID", "MERCADO_LIVRE_CLIENT_SECRET"],
    relatedRoutes: ["/entrar"],
    nextStep: "Confirmar necessidade do conector e escopos mínimos antes de qualquer OAuth.",
  },
];

export const dashboardMetrics = [
  { label: "Sessões ilustrativas", value: "18,4 mil", delta: "+12%", tone: "positive" },
  { label: "Uso em smartphones", value: "87%", delta: "prioridade", tone: "brand" },
  { label: "Rascunhos", value: "06", delta: "2 para revisar", tone: "neutral" },
  { label: "Pedidos demo", value: "24", delta: "sem cobrança", tone: "warning" },
] as const;

export const adminArticles = [
  { title: "Trocar uma moto por uma Spin financiada", category: "Negociações", status: "Publicado", source: "YouTube", updated: "há 18 min" },
  { title: "Negócio de gente grande", category: "Negociações", status: "Revisão", source: "YouTube", updated: "há 1 h" },
  { title: "Spin de leilão na troca", category: "Compra e Venda", status: "Rascunho", source: "YouTube", updated: "ontem" },
  { title: "O detalhe que muda o valor do seu carro", category: "Dicas", status: "Agendado", source: "Editorial", updated: "6 ago" },
] as const;

export const demoOrders = [
  { id: "DEMO-CHP-2A7C91", status: "Simulação concluída", total: "R$ 44,80", shipping: "Econômico", createdAt: "hoje, 14:32" },
  { id: "DEMO-CHP-9F20B4", status: "Revisão simulada", total: "R$ 74,70", shipping: "Expresso", createdAt: "hoje, 11:08" },
  { id: "DEMO-CHP-1D84E6", status: "Carrinho abandonado", total: "R$ 29,90", shipping: "Não escolhido", createdAt: "ontem, 21:17" },
] as const;

export const homeSections = [
  { id: "home_hero", position: "01", name: "Vídeo em destaque", detail: "Carrossel com os quatro vídeos mais recentes", status: "Publicado" },
  { id: "home_latest", position: "02", name: "Agora no Blog", detail: "Três artigos com maior prioridade editorial", status: "Publicado" },
  { id: "home_categories", position: "03", name: "Categorias", detail: "Navegação agrupada por missão do leitor", status: "Publicado" },
  { id: "home_store", position: "04", name: "Loja da comunidade", detail: "Chaveiro e miniatura 3D", status: "Publicado" },
  { id: "home_popular", position: "05", name: "Leituras em destaque", detail: "Ranking editorial sem analytics real", status: "Publicado" },
] as const;

export const auditEvents = [
  { action: "article.previewed", actor: "Editor demonstrativo", target: "Spin financiada", time: "14:48", result: "Permitido" },
  { action: "connector.flow_simulated", actor: "Owner demonstrativo", target: "Resend", time: "13:12", result: "Sem efeito externo" },
  { action: "product.updated", actor: "Operação demonstrativa", target: "Loja da comunidade", time: "ontem", result: "Não persistido" },
] as const;
