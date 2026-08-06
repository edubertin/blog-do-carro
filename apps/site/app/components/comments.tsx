"use client";

import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { useState } from "react";
import type { FormEvent, ReactElement } from "react";

export function Comments(): ReactElement {
  const [sent, setSent] = useState(false);
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSent(true);
  }
  if (sent) {
    return <p className="commentSuccess"><CheckCircle size={22} weight="fill" />Demonstração concluída — nenhum comentário foi enviado.</p>;
  }
  return (
    <form className="commentForm" onSubmit={handleSubmit}>
      <p className="formDisclosure">Demonstração: este formulário não publica nem envia dados.</p>
      <label><span>Seu nome</span><input name="name" autoComplete="name" required /></label>
      <label><span>Entre na conversa</span><textarea name="comment" rows={4} placeholder="Escreva seu comentário" required /></label>
      <button className="secondaryButton" type="submit">Enviar comentário</button>
    </form>
  );
}
