import type { Metadata } from "next";
import { SimplePage } from "@/app/components/simple-page";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Entenda como o Blog do Carro trata dados locais, vídeos incorporados e recursos demonstrativos.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage(): ReactElement {
  return (
    <SimplePage eyebrow="Transparência" title="Privacidade" intro="Esta demonstração limita o armazenamento local e explica antes de carregar conteúdo de terceiros.">
      <h2>Dados locais do mock</h2>
      <p>O carrinho salva somente produto e quantidade neste navegador. A confirmação guarda uma referência demonstrativa sem nome, e-mail, telefone ou endereço.</p>
      <h2 id="videos-do-youtube">Vídeos do YouTube</h2>
      <p>O player do YouTube não é carregado quando o artigo abre. Primeiro mostramos uma capa hospedada pelo Blog do Carro. Somente depois de selecionar “Reproduzir vídeo” o navegador se conecta ao domínio youtube-nocookie.com.</p>
      <p>Nessa etapa, o YouTube pode receber dados técnicos, como endereço IP, informações do navegador e do dispositivo. O modo de privacidade aprimorada reduz o uso de cookies antes da interação, mas não torna a reprodução anônima.</p>
      <p>Este protótipo ainda não possui uma central de preferências nem salva uma escolha global. Por isso, cada player exige uma ação explícita antes de ser carregado.</p>
      <h2>Antes da publicação</h2>
      <p>A política definitiva será adaptada aos serviços de analytics, newsletter, comentários e comércio realmente ativados no produto.</p>
    </SimplePage>
  );
}
