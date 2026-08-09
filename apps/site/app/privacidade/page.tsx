import type { Metadata } from "next";
import { SimplePage } from "@/app/components/simple-page";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Entenda como o Blog do Carro trata inscrições, vídeos incorporados e recursos em pré-lançamento.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage(): ReactElement {
  return (
    <SimplePage eyebrow="Transparência" title="Privacidade" intro="Coletamos somente o necessário, com finalidade clara e confirmação antes de enviar novidades.">
      <h2>Interesse na loja e newsletter</h2>
      <p>Quando a captação estiver aberta, solicitaremos somente seu e-mail e um consentimento específico. O interesse na Loja da Comunidade e a newsletter editorial são escolhas independentes.</p>
      <p>O endereço será armazenado de forma cifrada. Usaremos o Resend para entregar a confirmação e as mensagens autorizadas. Você poderá cancelar cada finalidade sem afetar a outra.</p>
      <h2>Loja em pré-lançamento</h2>
      <p>A loja ainda não cria cobrança, pedido, etiqueta ou envio. Carrinho e checkout permanecem fechados até a homologação comercial.</p>
      <h2 id="videos-do-youtube">Vídeos do YouTube</h2>
      <p>O player do YouTube não é carregado quando o artigo abre. Primeiro mostramos uma capa hospedada pelo Blog do Carro. Somente depois de selecionar “Reproduzir vídeo” o navegador se conecta ao domínio youtube-nocookie.com.</p>
      <p>Nessa etapa, o YouTube pode receber dados técnicos, como endereço IP, informações do navegador e do dispositivo. O modo de privacidade aprimorada reduz o uso de cookies antes da interação, mas não torna a reprodução anônima.</p>
      <p>Este protótipo ainda não possui uma central de preferências nem salva uma escolha global. Por isso, cada player exige uma ação explícita antes de ser carregado.</p>
      <h2>Seus direitos</h2>
      <p>Você pode solicitar confirmação de tratamento, correção, acesso, revogação do consentimento ou eliminação quando aplicável pelos canais de contato do Blog do Carro.</p>
    </SimplePage>
  );
}
