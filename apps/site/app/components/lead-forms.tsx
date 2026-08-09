"use client";

import { ArrowRight, CheckCircle, EnvelopeSimple } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { consentText } from "@/domain/audience";
import type { AudiencePurpose } from "@/domain/audience";

export type AudiencePublicConfig = Readonly<{ enabled: boolean; siteKey: string | null }>;

declare global {
  interface Window {
    turnstile?: Readonly<{
      render(container: HTMLElement, options: Readonly<{ sitekey: string; callback: (token: string) => void; "expired-callback": () => void }>): string;
      remove(widgetId: string): void;
    }>;
  }
}

function useTurnstile(siteKey: string | null, onToken: (token: string) => void) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!siteKey || !container.current) return;
    const scriptId = "cloudflare-turnstile-script";
    let widgetId = "";
    const render = () => {
      if (!container.current || !window.turnstile || widgetId) return;
      widgetId = window.turnstile.render(container.current, { sitekey: siteKey, callback: onToken, "expired-callback": () => onToken("") });
    };
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", render, { once: true });
      document.head.append(script);
    } else if (window.turnstile) render();
    else script.addEventListener("load", render, { once: true });
    return () => { if (widgetId) window.turnstile?.remove(widgetId); };
  }, [onToken, siteKey]);
  return container;
}

type LeadFormProps = Readonly<{
  config: AudiencePublicConfig;
  purpose: AudiencePurpose;
  productId?: string;
  compact?: boolean;
}>;

function LeadForm({ config, purpose, productId, compact = false }: LeadFormProps): ReactElement {
  const id = useId();
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const challenge = useTurnstile(config.siteKey, setToken);
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!config.enabled || !token || state === "sending") return;
    setState("sending");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/public/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), consent: form.get("consent") === "on", purpose, productId, sourcePath: window.location.pathname, turnstileToken: token }) });
      const payload: unknown = await response.json();
      const text = typeof payload === "object" && payload !== null && ("message" in payload || "error" in payload) ? String("message" in payload ? payload.message : payload.error) : "Não foi possível concluir agora.";
      setMessage(text);
      setState(response.ok ? "sent" : "error");
    } catch (error) {
      console.error(JSON.stringify({ event: "audience.form.failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
      setMessage("Não foi possível concluir agora. Tente novamente.");
      setState("error");
    }
  }
  if (state === "sent") return <p className="formSuccess" role="status"><CheckCircle size={22} weight="fill" />{message}</p>;
  return <form className={compact ? "audienceForm audienceForm--compact" : "audienceForm"} onSubmit={submit}><label className="audienceEmail" htmlFor={`${id}-email`}><span>E-mail</span><span><EnvelopeSimple size={20} aria-hidden="true" /><input id={`${id}-email`} name="email" type="email" autoComplete="email" maxLength={254} placeholder="voce@exemplo.com" required /></span></label><label className="consentField"><input name="consent" type="checkbox" required /><span>{consentText(purpose)}</span></label>{config.enabled ? <div className="turnstileSlot" ref={challenge} /> : <p className="formDisclosure">Lista em preparação. A captação será aberta após a configuração segura do e-mail.</p>}{state === "error" ? <p className="formError" role="alert">{message}</p> : null}<button className="primaryButton" type="submit" disabled={!config.enabled || !token || state === "sending"}>{state === "sending" ? "Enviando…" : purpose === "store_launch" ? "Confirmar meu interesse" : "Quero receber os artigos"}<ArrowRight size={20} weight="bold" /></button></form>;
}

export function NewsletterForm({ config }: Readonly<{ config: AudiencePublicConfig }>): ReactElement {
  return <LeadForm config={config} purpose="editorial_newsletter" compact />;
}

export function StoreInterestForm({ config, productId }: Readonly<{ config: AudiencePublicConfig; productId: string }>): ReactElement {
  return <LeadForm config={config} purpose="store_launch" productId={productId} />;
}
