import type { ReactElement } from "react";
import { auditEvents } from "../admin-data";
import { requireAdminPage } from "../admin-auth";
import { AdminCard, AdminPageHeader, MetricCard } from "../admin-ui";
import { MockAction } from "../mock-action";
import type { AdminIdentity } from "../admin-auth-core";

const roles = [
  { name: "Owner", scope: "Usuários, flags, conectores e auditoria" },
  { name: "Editor", scope: "Criar e editar conteúdo, sem publicar" },
  { name: "Publicador", scope: "Revisar, agendar e publicar artigos" },
  { name: "Operação", scope: "Produtos e pedidos, sem secrets" },
] as const;

function RoleMatrix(): ReactElement {
  return <AdminCard title="Papéis propostos" eyebrow="RBAC futuro"><div className="adminObjectList">{roles.map((role) => <article className="adminObjectRow" key={role.name}><div><h3>{role.name}</h3><p>{role.scope}</p></div><span>não ativo</span></article>)}</div></AdminCard>;
}

function AuditPreview(): ReactElement {
  return <AdminCard title="Trilha de auditoria" eyebrow="Eventos fictícios"><div className="adminObjectList">{auditEvents.map((event) => <article className="adminObjectRow" key={`${event.action}-${event.time}`}><div><h3>{event.action}</h3><p>{event.actor} · {event.target}</p></div><span>{event.result}<br />{event.time}</span></article>)}</div></AdminCard>;
}

function SecurityGates(): ReactElement {
  return (
    <AdminCard title="Fronteira de segurança" eyebrow="Deny by default"><div className="adminTimeline"><div className="adminTimelineItem"><strong>Identidade gerenciada</strong><p>O D1 não armazena senha administrativa.</p></div><div className="adminTimelineItem"><strong>Autorização no servidor</strong><p>Cada API repete a permissão; esconder botão não autoriza.</p></div><div className="adminTimelineItem"><strong>Secrets fora do painel</strong><p>Somente status, ambiente e saúde ficam visíveis.</p></div><div className="adminTimelineItem"><strong>Ações críticas com fricção</strong><p>Reautenticação, confirmação e log append-only.</p></div></div></AdminCard>
  );
}

function CurrentIdentity({ actorId, displayName, localPreview }: AdminIdentity): ReactElement {
  return (
    <AdminCard title="Identidade desta sessão" eyebrow="Sites SIWC">
      <div className="adminSecretList">
        <div className="adminSecretRow"><code>Nome</code><span>{displayName}</span></div>
        <div className="adminSecretRow"><code>ID estável do Sites</code><span>{localPreview ? "disponível no preview publicado" : actorId}</span></div>
        <div className="adminSecretRow"><code>Papel atual</code><span>owner</span></div>
      </div>
      <div className="adminCallout">Use o ID exibido aqui para concluir o provisionamento server-side. Ele não é senha nem token.</div>
    </AdminCard>
  );
}

export default async function SecurityPage(): Promise<ReactElement> {
  const identity = await requireAdminPage("audit.read");
  if (!identity) return <></>;
  const sessionValue = identity.localPreview ? "Prévia" : "Sim";
  const sessionDetail = identity.localPreview ? "loopback local" : "Sites SIWC";
  return (
    <><AdminPageHeader eyebrow="Segurança" title="Acesso e auditoria" description="A identidade e a autorização já são validadas no servidor. Papéis adicionais e auditoria persistente continuam desativados." action={<MockAction label="Revisar acesso" message="A revisão é somente visual. Nenhuma permissão foi alterada." />} /><div className="adminGrid adminGrid--metrics"><MetricCard label="Admin autenticado" value={sessionValue} detail={sessionDetail} tone="positive" /><MetricCard label="RBAC" value="1" detail="owner ativo" /><MetricCard label="Secrets no painel" value="0" detail="por desenho" tone="positive" /><MetricCard label="Audit log real" value="Não" detail="fixtures abaixo" /></div><div className="adminGrid adminGrid--split" style={{ marginTop: 14 }}><CurrentIdentity {...identity} /><SecurityGates /></div><div className="adminGrid adminGrid--split" style={{ marginTop: 14 }}><RoleMatrix /><AuditPreview /></div></>
  );
}
