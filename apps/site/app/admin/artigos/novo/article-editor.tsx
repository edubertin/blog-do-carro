"use client";

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { AdminCard } from "../../admin-ui";
import { MockAction } from "../../mock-action";

function VideoSourceSection(): ReactElement {
  return (
    <section className="adminFormSection"><h2>1. Origem no YouTube</h2><p>O link cria o contexto inicial; título editorial e análise continuam independentes.</p><div className="adminFieldGrid"><label className="adminField"><span>URL do vídeo</span><input type="url" required defaultValue="https://www.youtube.com/watch?v=jT0j_rCgbbc" /><small>Nesta demonstração, nenhuma requisição é enviada ao YouTube.</small></label><MockAction label="Ler metadados (simulado)" message="Metadados fictícios carregados apenas nesta tela." /></div></section>
  );
}

function EditorialSection(): ReactElement {
  return (
    <section className="adminFormSection"><h2>2. História editorial</h2><p>Transforme o vídeo em uma leitura clara, útil e independente.</p><div className="adminFieldGrid"><label className="adminField"><span>Título</span><input required defaultValue="Trocar uma moto por uma Spin financiada: foi bom negócio?" /></label><label className="adminField"><span>Subtítulo</span><textarea required defaultValue="O vídeo diverte, mas a conta pede atenção: entrada, prazo, juros e custo de uso mudam o resultado da troca." /></label><div className="adminFieldGrid adminFieldGrid--two"><label className="adminField"><span>Categoria</span><select required defaultValue="Negociações"><option>Negociações</option><option>Compra e Venda</option><option>Mercado Automotivo</option></select></label><label className="adminField"><span>Autor</span><input required defaultValue="Redação Blog do Carro" /></label></div><label className="adminField"><span>Artigo completo</span><textarea required defaultValue="Trocar uma moto por um carro familiar resolve uma necessidade real. O cálculo precisa considerar entrada, custo total do financiamento e manutenção provável." /></label></div></section>
  );
}

function ImageSection(): ReactElement {
  return (
    <section className="adminFormSection"><h2>3. Imagem principal</h2><p>O mock permite escolher um arquivo local para validar o fluxo, mas não faz upload.</p><div className="adminFieldGrid"><label className="adminField"><span>Imagem atual</span><input required defaultValue="/editorial/moto-spin-cover.webp" /></label><label className="adminField"><span>Substituir por arquivo local</span><input type="file" accept="image/png,image/jpeg,image/webp" /><small>PNG, JPEG ou WebP. O arquivo permanece apenas no seletor do navegador.</small></label></div></section>
  );
}

function OpinionAndFaqSection(): ReactElement {
  return (
    <section className="adminFormSection"><h2>4. Opinião e FAQ</h2><p>A voz do Blog do Carro fica explícita e as dúvidas mais importantes viram respostas curtas.</p><div className="adminFieldGrid"><label className="adminField"><span>Minha opinião</span><textarea required defaultValue="Se a Spin resolve a vida da família, a troca pode fazer sentido. Mas o bom negócio só aparece depois de olhar o valor total." /></label><label className="adminField"><span>Pergunta frequente</span><input required defaultValue="Uma parcela menor significa melhor negócio?" /></label><label className="adminField"><span>Resposta</span><textarea required defaultValue="Não necessariamente. Prazos longos reduzem a parcela e podem elevar bastante o total pago." /></label><label className="adminField"><span>Artigo relacionado</span><input required defaultValue="como-calcular-custo-total-financiamento" /></label></div></section>
  );
}

function SeoSection(): ReactElement {
  return (
    <section className="adminFormSection"><h2>5. Busca e compartilhamento</h2><p>O navegador bloqueia a revisão quando faltam os campos obrigatórios deste mock.</p><div className="adminFieldGrid"><label className="adminField"><span>Slug</span><input required defaultValue="moto-por-spin-financiada-bom-negocio" /></label><label className="adminField"><span>Meta description</span><textarea required defaultValue="Veja como avaliar entrada, juros e custo total antes de trocar uma moto por uma Chevrolet Spin financiada." /></label><label className="adminField"><span>Texto alternativo da imagem</span><input required defaultValue="Frame do vídeo sobre a troca de uma moto por uma Chevrolet Spin" /></label></div></section>
  );
}

function EditorActions({ feedback }: Readonly<{ feedback: string }>): ReactElement {
  return <div className="adminFormActions"><MockAction label="Salvar rascunho" message="Rascunho simulado. Recarregar a página restaura o conteúdo inicial." variant="secondary" /><button className="adminButton adminButton--secondary" type="submit">Validar para revisão</button><MockAction label="Publicar (simulado)" message="Publicação bloqueada: o mock nunca altera o portal público." variant="primary" />{feedback ? <span className="mockFeedback" role="status">{feedback}</span> : null}</div>;
}

function EditorialChecklist(): ReactElement {
  return (
    <AdminCard title="Critérios para revisão" eyebrow="Checklist do mock"><div className="adminTimeline"><div className="adminTimelineItem"><strong>Campos obrigatórios</strong><p>O botão de validação sinaliza qualquer ausência antes do feedback.</p></div><div className="adminTimelineItem"><strong>Imagem e relacionados</strong><p>O fluxo visual cobre seleção de arquivo, texto alternativo e conteúdo relacionado.</p></div><div className="adminTimelineItem"><strong>Pendente no produto real</strong><p>Upload R2, preview isolado, revisão e audit log.</p></div></div><div className="adminCallout" style={{ marginTop: 8 }}><strong>Aviso:</strong> a coleção pública de artigos continua separada deste formulário demonstrativo.</div></AdminCard>
  );
}

export function ArticleEditor(): ReactElement {
  const [feedback, setFeedback] = useState("");
  const validateForReview = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setFeedback("Estrutura validada localmente. Nenhuma tarefa ou publicação foi criada."); };
  return <div className="adminGrid adminGrid--split"><AdminCard><form onSubmit={validateForReview}><VideoSourceSection /><EditorialSection /><ImageSection /><OpinionAndFaqSection /><SeoSection /><EditorActions feedback={feedback} /></form></AdminCard><EditorialChecklist /></div>;
}
