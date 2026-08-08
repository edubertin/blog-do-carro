import type { ReactElement } from "react";
import { AdminCard, AdminPageHeader } from "../../admin-ui";
import { MockAction } from "../../mock-action";

function StoreForm(): ReactElement {
  return (
    <AdminCard><div className="adminFormSection"><h2>Identidade da loja</h2><p>Informações públicas e não sensíveis da Loja da Comunidade.</p><div className="adminFieldGrid adminFieldGrid--two"><label className="adminField"><span>Nome</span><input defaultValue="Loja da Comunidade" /></label><label className="adminField"><span>Linha ativa</span><input defaultValue="Produtos em impressão 3D" /></label></div><label className="adminField" style={{ marginTop: 14 }}><span>Mensagem de segurança</span><textarea defaultValue="Compra simulada. Nenhuma cobrança, pedido ou etiqueta será criada." /></label></div><div className="adminFormSection"><h2>Operação futura</h2><p>As opções permanecem desabilitadas até as fases comerciais e jurídicas.</p><div className="adminFieldGrid adminFieldGrid--two"><label className="adminField"><span>Moeda</span><input value="BRL" disabled readOnly /></label><label className="adminField"><span>Modo da loja</span><input value="Demonstração" disabled readOnly /></label><label className="adminField"><span>Pagamento</span><input value="Não conectado" disabled readOnly /></label><label className="adminField"><span>Frete</span><input value="Não conectado" disabled readOnly /></label></div></div><div className="adminFormActions"><MockAction label="Salvar configurações" message="Configurações simuladas. Nada foi persistido." variant="primary" /></div></AdminCard>
  );
}

function PolicyChecklist(): ReactElement {
  return <AdminCard title="Checklist comercial" eyebrow="Antes da primeira venda"><div className="adminTimeline"><div className="adminTimelineItem"><strong>Produto e fornecedor</strong><p>Amostra aprovada, estoque e prazo reais.</p></div><div className="adminTimelineItem"><strong>Políticas públicas</strong><p>Entrega, troca, devolução, privacidade e suporte.</p></div><div className="adminTimelineItem"><strong>Conectores homologados</strong><p>Pagamento e frete testados em sandbox e produção separada.</p></div></div></AdminCard>;
}

export default function StoreSettingsPage(): ReactElement {
  return <><AdminPageHeader eyebrow="Loja" title="Configurações" description="O lugar para identidade, políticas e parâmetros comerciais. Credenciais nunca entram aqui." /><div className="adminGrid adminGrid--split"><StoreForm /><PolicyChecklist /></div></>;
}
