"use client";

import { useState } from "react";
import type { ReactElement } from "react";

type State = "ready" | "confirming" | "confirmed" | "invalid";

export function ConfirmationClient(): ReactElement {
  const [state, setState] = useState<State>("ready");
  async function confirm(): Promise<void> {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    window.history.replaceState(null, "", window.location.pathname);
    if (!token) { setState("invalid"); return; }
    setState("confirming");
    try {
      const result = await fetch("/api/public/subscriptions/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      setState(result.ok ? "confirmed" : "invalid");
    } catch (error) {
      console.error(JSON.stringify({ event: "audience.confirmation.client_failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
      setState("invalid");
    }
  }
  if (state === "confirmed") return <p className="formSuccess">Inscrição confirmada. Obrigado por fazer parte da comunidade.</p>;
  if (state === "invalid") return <p className="formError" role="alert">Este link é inválido ou expirou.</p>;
  return <button className="primaryButton" type="button" disabled={state === "confirming"} onClick={confirm}>{state === "confirming" ? "Confirmando…" : "Confirmar meu e-mail"}</button>;
}
