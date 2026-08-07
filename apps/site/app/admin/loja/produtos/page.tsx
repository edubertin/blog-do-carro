import type { ReactElement } from "react";
import { AdminCard, AdminPageHeader } from "../../admin-ui";
import { ProductsManager } from "./products-manager";

export default function ProductsPage(): ReactElement {
  return <><AdminPageHeader eyebrow="Loja" title="Produtos" description="Adicione, arquive e revise itens da comunidade sem ativar estoque, pagamento ou entrega." /><div className="adminGrid adminGrid--split"><ProductsManager /><AdminCard title="Chaveiro Presente" eyebrow="Produto piloto"><div className="adminTimeline"><div className="adminTimelineItem"><strong>Validação física</strong><p>Fornecedor, amostra, material, embalagem e lote mínimo.</p></div><div className="adminTimelineItem"><strong>Regras comerciais</strong><p>Preço, estoque, troca, devolução e atendimento.</p></div><div className="adminTimelineItem"><strong>Ativação técnica</strong><p>Pedido persistente, pagamento idempotente e frete homologado.</p></div></div></AdminCard></div></>;
}
