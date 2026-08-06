"use client";

import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { EnvelopeSimple } from "@phosphor-icons/react/EnvelopeSimple";
import { useState } from "react";
import type { FormEvent, ReactElement } from "react";

export function NewsletterForm(): ReactElement {
  const [sent, setSent] = useState(false);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }
  if (sent) {
    return <p className="formSuccess"><CheckCircle size={22} weight="fill" />Demonstração concluída — nenhum e-mail foi cadastrado.</p>;
  }
  return (
    <div className="newsletterDemo">
      <form className="newsletterForm" onSubmit={handleSubmit}>
        <label><span className="srOnly">Seu melhor e-mail</span><EnvelopeSimple size={20} /><input type="email" placeholder="Seu melhor e-mail" required /></label>
        <button type="submit" aria-label="Simular cadastro na newsletter"><ArrowRight size={21} weight="bold" /></button>
      </form>
      <small>Demonstração: nenhum dado será enviado.</small>
    </div>
  );
}

export function ProductInterestForm(): ReactElement {
  const [sent, setSent] = useState(false);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }
  if (sent) {
    return <div className="interestSuccess"><CheckCircle size={28} weight="fill" /><strong>Interesse simulado!</strong><p>Nenhum dado foi enviado ou salvo.</p></div>;
  }
  return (
    <form className="interestForm" onSubmit={handleSubmit}>
      <p className="formDisclosure">Demonstração: a lista de interesse ainda não está conectada.</p>
      <label>Nome<input name="name" autoComplete="name" required /></label>
      <label>E-mail<input type="email" name="email" autoComplete="email" required /></label>
      <div className="interestRow"><label>Quantidade<select name="quantity" defaultValue="1"><option value="1">1 unidade</option><option value="2">2 unidades</option><option value="3">3 unidades</option></select></label><label>CEP opcional<input name="postalCode" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" /></label></div>
      <label className="consentField"><input type="checkbox" required /><span>Aceito receber novidades sobre este produto.</span></label>
      <button className="primaryButton" type="submit">Quero entrar no primeiro lote <ArrowRight size={20} weight="bold" /></button>
    </form>
  );
}
