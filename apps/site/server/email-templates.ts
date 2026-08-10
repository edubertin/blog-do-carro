import type { AudiencePurpose } from "@/domain/audience";

export type BlogEmail = Readonly<{
  subject: string;
  preheader: string;
  html: string;
  text: string;
}>;

type TemplateContent = Readonly<{
  eyebrow: string;
  title: string;
  introduction: string;
  buttonLabel: string;
  link: string;
  expiry: string;
  securityNote: string;
  receiptReason: string;
}>;

const brand = {
  background: "#0D0D0D",
  surface: "#151515",
  border: "#2A2A2A",
  yellow: "#F4B400",
  white: "#FFFFFF",
  muted: "#B7B7B7",
} as const;

function safeLink(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("Link de e-mail precisa usar HTTPS.");
  }
  return url.toString().replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function emailText(content: TemplateContent): string {
  return [
    content.title,
    "",
    content.introduction,
    "",
    `${content.buttonLabel}: ${content.link}`,
    "",
    content.expiry,
    content.securityNote,
    content.receiptReason,
    "",
    "Blog do Carro — informação para negociar melhor.",
  ].join("\n");
}

function emailBody(content: TemplateContent, preheader: string): string {
  const link = safeLink(content.link);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${content.title}</title><style>@media(max-width:480px){.email-pad{padding-left:22px!important;padding-right:22px!important}.email-cta,.email-cta table{width:100%!important}.email-cta a{display:block!important;text-align:center!important}.email-title{font-size:28px!important}}</style></head><body style="margin:0;background:#F2F2F2;color:${brand.white};font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F2F2F2"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:${brand.surface};border:1px solid ${brand.border};border-radius:12px;overflow:hidden"><tr><td class="email-pad" style="padding:24px 28px;border-bottom:3px solid ${brand.yellow}"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="padding-right:12px"><img src="https://blogdocarro.com/brand/blog-do-carro-icon.png" width="42" height="42" alt="" style="display:block;width:42px;height:42px"></td><td style="color:${brand.white};font-size:20px;font-weight:800;letter-spacing:-.5px">Blog<span style="color:${brand.yellow}">DoCarro</span>.com</td></tr></table></td></tr><tr><td class="email-pad" style="padding:36px 28px 20px"><p style="margin:0 0 14px;color:${brand.yellow};font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase">${content.eyebrow}</p><h1 class="email-title" style="margin:0 0 18px;color:${brand.white};font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.08;letter-spacing:-1px">${content.title}</h1><p style="margin:0;color:#C9C9C9;font-size:16px;line-height:1.6">${content.introduction}</p></td></tr><tr><td class="email-pad email-cta" style="padding:8px 28px 30px"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="${brand.yellow}" style="border-radius:10px"><a href="${link}" style="display:inline-block;padding:16px 24px;color:${brand.background};font-size:15px;font-weight:800;text-decoration:none">${content.buttonLabel}</a></td></tr></table></td></tr><tr><td class="email-pad" style="padding:0 28px 34px"><p style="margin:0 0 10px;color:${brand.white};font-size:14px;line-height:1.55">${content.expiry}</p><p style="margin:0;color:#C9C9C9;font-size:13px;line-height:1.55">${content.securityNote}</p><p style="margin:20px 0 8px;color:#C9C9C9;font-size:12px">Se o botão não abrir, copie este endereço:</p><p style="margin:0;word-break:break-all;color:${brand.yellow};font-size:12px;line-height:1.5"><a href="${link}" style="color:${brand.yellow};text-decoration:underline">${link}</a></p></td></tr><tr><td class="email-pad" style="padding:22px 28px;background:${brand.background};border-top:1px solid ${brand.border}"><p style="margin:0 0 8px;color:${brand.white};font-size:13px;font-weight:700">Blog do Carro</p><p style="margin:0 0 8px;color:#C9C9C9;font-size:12px;line-height:1.5">${content.receiptReason}</p><p style="margin:0;color:#C9C9C9;font-size:12px;line-height:1.5">Informação direta para comprar, vender e negociar melhor.</p></td></tr></table></td></tr></table></body></html>`;
}

function createEmail(subject: string, preheader: string, content: TemplateContent): BlogEmail {
  return { subject, preheader, html: emailBody(content, preheader), text: emailText(content) };
}

export function buildAudienceConfirmationEmail(link: string, purpose: AudiencePurpose): BlogEmail {
  if (purpose === "store_launch") {
    return createEmail("Confirme seu interesse na Loja da Comunidade", "Só falta confirmar seu e-mail para receber o aviso de lançamento.", {
      eyebrow: "Loja da Comunidade",
      title: "Você está quase na lista.",
      introduction: "Confirme seu e-mail para receber novidades e o aviso quando os produtos da Loja da Comunidade forem lançados.",
      buttonLabel: "Confirmar meu interesse",
      link,
      expiry: "Este link é válido por 24 horas e pode ser usado uma única vez.",
      securityNote: "Se você não pediu este aviso, ignore a mensagem. Nenhuma outra lista será ativada.",
      receiptReason: "Este e-mail confirma apenas o interesse na loja e não ativa a newsletter editorial.",
    });
  }
  return createEmail("Confirme os artigos do Blog do Carro", "Confirme seu e-mail para receber novos artigos e análises.", {
    eyebrow: "Direto ao ponto",
    title: "Confirme sua inscrição.",
    introduction: "Confirme seu e-mail para receber os novos artigos e análises do Blog do Carro, sem ruído e sem misturar esta inscrição com a loja.",
    buttonLabel: "Quero receber os artigos",
    link,
    expiry: "Este link é válido por 24 horas e pode ser usado uma única vez.",
    securityNote: "Se você não solicitou a inscrição, ignore a mensagem. Seu e-mail não será confirmado.",
    receiptReason: "Você recebeu esta mensagem após solicitar os artigos. A Loja da Comunidade continua separada.",
  });
}

export function buildCustomerAccessEmail(link: string): BlogEmail {
  return createEmail("Seu acesso ao Blog do Carro", "Use o link seguro para acessar sua área de cliente.", {
    eyebrow: "Acesso seguro",
    title: "Entre sem precisar de senha.",
    introduction: "Use o botão abaixo para confirmar que este e-mail é seu e acessar a área de cliente do Blog do Carro.",
    buttonLabel: "Entrar no Blog do Carro",
    link,
    expiry: "Este link expira em 5 minutos e funciona apenas uma vez.",
    securityNote: "Não encaminhe esta mensagem. O Blog do Carro nunca pedirá sua senha ou dados de pagamento por e-mail.",
    receiptReason: "Esta é uma mensagem transacional de acesso, sem inscrição em listas de marketing.",
  });
}
