import type { ReactElement } from "react";
import { AdminCard, AdminPageHeader } from "../../admin-ui";
import { ProductsManager } from "./products-manager";

export default function ProductsPage(): ReactElement {
  return <><AdminPageHeader eyebrow="Loja" title="Produtos" description="Adicione, arquive e revise itens da comunidade sem ativar estoque, pagamento ou entrega." /><div className="adminGrid adminGrid--split"><ProductsManager /><AdminCard title="Produtos em impressão 3D" eyebrow="Linha piloto"><div className="adminTimeline"><div className="adminTimelineItem"><strong>Validação física</strong><p>Modelagem, amostra, material, embalagem e lote mínimo.</p></div><div className="adminTimelineItem"><strong>Regras comerciais</strong><p>Preço, estoque, troca, devolução e atendimento.</p></div><div className="adminTimelineItem"><strong>Ativação técnica</strong><p>Pedido persistente, pagamento idempotente e frete homologado.</p></div></div></AdminCard></div></>;
}
