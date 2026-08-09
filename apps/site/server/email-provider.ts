export type TransactionalEmail = Readonly<{
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}>;

export interface EmailProvider {
  sendTransactional(message: TransactionalEmail): Promise<void>;
}

export class DisabledEmailProvider implements EmailProvider {
  sendTransactional(): Promise<void> {
    return Promise.reject(new Error("Transporte de e-mail desativado."));
  }
}

export class ResendEmailProvider implements EmailProvider {
  constructor(private readonly apiKey: string, private readonly from: string) {}

  async sendTransactional(message: TransactionalEmail): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": message.idempotencyKey,
        "User-Agent": "blog-do-carro-sites/1.0",
      },
      body: JSON.stringify({ from: this.from, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
    });
    if (!response.ok) throw new Error(`Resend recusou o envio: ${response.status}`);
  }
}
