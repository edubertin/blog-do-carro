"use client";

import { ArrowClockwise } from "@phosphor-icons/react/ArrowClockwise";
import { useEffect } from "react";
import type { ReactElement } from "react";

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ErrorPage({ error, reset }: ErrorPageProps): ReactElement {
  useEffect(() => {
    console.error("Falha de renderização no portal.", { digest: error.digest, name: error.name });
  }, [error]);

  return (
    <main className="simplePage">
      <section className="simpleHero">
        <span className="eyebrow">Falha temporária</span>
        <h1>Esta página saiu da rota.</h1>
        <p>Nenhum dado foi perdido. Tente carregar novamente; se o problema persistir, volte ao início.</p>
        <button className="primaryButton" type="button" onClick={reset}>
          Tentar novamente <ArrowClockwise size={20} weight="bold" />
        </button>
      </section>
    </main>
  );
}
