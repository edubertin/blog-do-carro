"use client";

import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { LockKey } from "@phosphor-icons/react/LockKey";
import { MapPin } from "@phosphor-icons/react/MapPin";
import { Package } from "@phosphor-icons/react/Package";
import { UserCircle } from "@phosphor-icons/react/UserCircle";
import { SiteLink as Link } from "@/app/components/site-link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Dispatch, FormEvent, ReactElement, ReactNode, SetStateAction } from "react";
import { useCart } from "@/app/commerce/cart-provider";
import { formatMoney, keychainProduct, shippingById, shippingOptions } from "@/app/commerce/catalog";
import type { ShippingId } from "@/app/commerce/catalog";
import { initialAddress, initialBuyer } from "@/app/commerce/checkout-types";
import type { AddressDetails, BuyerDetails, CheckoutStep } from "@/app/commerce/checkout-types";
import { createDemoOrder, saveDemoOrder } from "@/app/commerce/demo-order-storage";
import { commerceIntegrations } from "@/app/commerce/integration-config";

const stepOrder: readonly CheckoutStep[] = ["identity", "delivery", "payment", "review"];

export function CheckoutFlow(): ReactElement {
  const [step, setStep] = useState<CheckoutStep>("identity");
  const [buyer, setBuyer] = useState<BuyerDetails>(initialBuyer);
  const [address, setAddress] = useState<AddressDetails>(initialAddress);
  const [shippingId, setShippingId] = useState<ShippingId>("economico");
  const [submitting, setSubmitting] = useState(false);
  const previousStep = useRef<CheckoutStep>("identity");
  const stepPanelRef = useRef<HTMLElement>(null);
  const { items, ready, clearCart } = useCart();
  const router = useRouter();
  const item = items[0];

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    stepPanelRef.current?.querySelector<HTMLElement>("h2")?.focus();
  }, [step]);

  async function completeSimulation(): Promise<void> {
    if (!item || submitting) return;
    setSubmitting(true);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 650));
    const order = createDemoOrder(item.quantity, shippingId);
    saveDemoOrder(order);
    clearCart();
    router.push(`/pedido/demo/${order.id}`);
  }

  if (!ready) return <div className="commerceShell commerceLoading" role="status">Preparando o checkout…</div>;
  if (!item) return <EmptyCheckout />;
  const subtotal = keychainProduct.priceCents * item.quantity;
  return (
    <div className="commerceShell checkoutShell">
      <DemoNotice />
      <header className="commerceIntro checkoutIntro"><span className="eyebrow">Finalizar demonstração</span><h1>Seu pedido, passo a passo.</h1><p>As informações ficam somente na memória desta página e somem ao fechar ou recarregar o fluxo.</p></header>
      <CheckoutProgress current={step} />
      <div className="checkoutLayout">
        <section className="checkoutPanel" ref={stepPanelRef}>{renderStep({ step, buyer, address, shippingId, submitting, setBuyer, setAddress, setShippingId, setStep, completeSimulation })}</section>
        <CheckoutSummary quantity={item.quantity} subtotal={subtotal} shippingId={shippingId} />
      </div>
    </div>
  );
}

type RenderStepProps = Readonly<{
  step: CheckoutStep;
  buyer: BuyerDetails;
  address: AddressDetails;
  shippingId: ShippingId;
  submitting: boolean;
  setBuyer: Dispatch<SetStateAction<BuyerDetails>>;
  setAddress: Dispatch<SetStateAction<AddressDetails>>;
  setShippingId: Dispatch<SetStateAction<ShippingId>>;
  setStep: Dispatch<SetStateAction<CheckoutStep>>;
  completeSimulation: () => Promise<void>;
}>;

function renderStep(props: RenderStepProps): ReactElement {
  if (props.step === "identity") return <IdentityStep buyer={props.buyer} setBuyer={props.setBuyer} onNext={() => props.setStep("delivery")} />;
  if (props.step === "delivery") return <DeliveryStep address={props.address} setAddress={props.setAddress} shippingId={props.shippingId} setShippingId={props.setShippingId} onBack={() => props.setStep("identity")} onNext={() => props.setStep("payment")} />;
  if (props.step === "payment") return <PaymentStep onBack={() => props.setStep("delivery")} onNext={() => props.setStep("review")} />;
  return <ReviewStep buyer={props.buyer} address={props.address} submitting={props.submitting} onBack={() => props.setStep("payment")} onEditIdentity={() => props.setStep("identity")} onEditDelivery={() => props.setStep("delivery")} onComplete={props.completeSimulation} />;
}

function DemoNotice(): ReactElement {
  return <div className="demoNotice" role="note"><LockKey size={20} weight="fill" /><div><strong>Ambiente de demonstração</strong><span>Nenhuma compra, cobrança, etiqueta ou entrega será criada.</span></div></div>;
}

function CheckoutProgress({ current }: Readonly<{ current: CheckoutStep }>): ReactElement {
  const currentIndex = stepOrder.indexOf(current);
  const labels = ["Dados", "Entrega", "Pix", "Revisão"] as const;
  return (
    <ol className="checkoutProgress" aria-label="Progresso do checkout">
      {labels.map((label, index) => <li className={index <= currentIndex ? "active" : ""} aria-current={index === currentIndex ? "step" : undefined} key={label}><span>{index + 1}</span><strong>{label}</strong></li>)}
    </ol>
  );
}

type IdentityStepProps = Readonly<{
  buyer: BuyerDetails;
  setBuyer: Dispatch<SetStateAction<BuyerDetails>>;
  onNext: () => void;
}>;

function IdentityStep({ buyer, setBuyer, onNext }: IdentityStepProps): ReactElement {
  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onNext();
  }
  return (
    <form className="checkoutForm" onSubmit={submit}>
      <StepHeading icon={<UserCircle size={24} weight="fill" />} label="01 · Identificação" title="Quem está comprando?" description="Neste mock, você continua como convidado." />
      <IntegrationStatus name="Login Mercado Livre" detail="Conexão reservada para a implementação real." enabled={commerceIntegrations.mercadoLivreLogin} />
      <div className="checkoutFormGrid">
        <InputField label="Nome completo" value={buyer.name} onChange={(value) => setBuyer((current) => ({ ...current, name: value }))} autoComplete="name" minLength={2} />
        <InputField label="E-mail" type="email" value={buyer.email} onChange={(value) => setBuyer((current) => ({ ...current, email: value }))} autoComplete="email" />
        <InputField label="WhatsApp opcional" type="tel" inputMode="tel" required={false} value={buyer.phone} onChange={(value) => setBuyer((current) => ({ ...current, phone: value }))} autoComplete="tel" />
      </div>
      <label className="checkoutConsent"><input type="checkbox" checked={buyer.consent} onChange={(event) => setBuyer((current) => ({ ...current, consent: event.target.checked }))} required /><span>Entendi que esta é uma simulação e que nenhum dado será enviado.</span></label>
      <StepActions nextLabel="Continuar para entrega" />
    </form>
  );
}

type DeliveryStepProps = Readonly<{
  address: AddressDetails;
  setAddress: Dispatch<SetStateAction<AddressDetails>>;
  shippingId: ShippingId;
  setShippingId: Dispatch<SetStateAction<ShippingId>>;
  onBack: () => void;
  onNext: () => void;
}>;

function DeliveryStep(props: DeliveryStepProps): ReactElement {
  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    props.onNext();
  }
  function fillExample(): void {
    props.setAddress({ postalCode: "13630-000", street: "Rua Demonstração", number: "123", complement: "", neighborhood: "Centro", city: "Cidade Exemplo", state: "SP" });
  }
  const update = props.setAddress;
  return (
    <form className="checkoutForm" onSubmit={submit}>
      <StepHeading icon={<MapPin size={24} weight="fill" />} label="02 · Entrega" title="Onde chegaria?" description="Preencha um endereço apenas para testar o desenho do fluxo." />
      <IntegrationStatus name="Meu Envio" detail="Prazos e valores abaixo são fixtures locais." enabled={commerceIntegrations.meuEnvio} />
      <button className="exampleDataButton" type="button" onClick={fillExample}>Preencher endereço fictício</button>
      <div className="checkoutFormGrid addressGrid">
        <InputField label="CEP" value={props.address.postalCode} onChange={(value) => update((current) => ({ ...current, postalCode: value }))} inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}-?[0-9]{3}" placeholder="00000-000" />
        <InputField label="Rua" value={props.address.street} onChange={(value) => update((current) => ({ ...current, street: value }))} autoComplete="address-line1" />
        <InputField label="Número" value={props.address.number} onChange={(value) => update((current) => ({ ...current, number: value }))} inputMode="numeric" autoComplete="address-line2" />
        <InputField label="Complemento opcional" required={false} value={props.address.complement} onChange={(value) => update((current) => ({ ...current, complement: value }))} autoComplete="address-line2" />
        <InputField label="Bairro" value={props.address.neighborhood} onChange={(value) => update((current) => ({ ...current, neighborhood: value }))} />
        <InputField label="Cidade" value={props.address.city} onChange={(value) => update((current) => ({ ...current, city: value }))} autoComplete="address-level2" />
        <InputField label="UF" value={props.address.state} onChange={(value) => update((current) => ({ ...current, state: value.toUpperCase().slice(0, 2) }))} autoComplete="address-level1" maxLength={2} />
      </div>
      <ShippingOptions selected={props.shippingId} onSelect={props.setShippingId} />
      <StepActions back={props.onBack} nextLabel="Ir para o Pix simulado" />
    </form>
  );
}

function ShippingOptions(props: Readonly<{ selected: ShippingId; onSelect: (id: ShippingId) => void }>): ReactElement {
  return (
    <fieldset className="shippingOptions"><legend>Escolha um frete simulado</legend>
      {shippingOptions.map((option) => <label className={props.selected === option.id ? "selected" : ""} key={option.id}><input type="radio" name="shipping" value={option.id} checked={props.selected === option.id} onChange={() => props.onSelect(option.id)} /><span><strong>{option.name}</strong><small>{option.estimate} · prazo simulado</small></span><b>{formatMoney(option.priceCents)}</b></label>)}
    </fieldset>
  );
}

function PaymentStep(props: Readonly<{ onBack: () => void; onNext: () => void }>): ReactElement {
  return (
    <div className="checkoutForm paymentStep">
      <StepHeading icon={<LockKey size={24} weight="fill" />} label="03 · Pagamento" title="Pix, sem pagar nada." description="Esta etapa demonstra a confirmação visual. Não existe QR Code ou código bancário válido." />
      <IntegrationStatus name="PayPix" detail="Nenhuma API, chave ou cobrança está conectada." enabled={commerceIntegrations.payPix} />
      <div className="demoPix"><LockKey size={34} weight="duotone" /><span>PIX DEMONSTRATIVO</span><strong>Nenhum QR Code ou código será gerado.</strong><p>A implementação real ficará isolada atrás do provedor de pagamento.</p></div>
      <StepActions back={props.onBack} nextLabel="Revisar pedido" onNext={props.onNext} />
    </div>
  );
}

type ReviewStepProps = Readonly<{
  buyer: BuyerDetails;
  address: AddressDetails;
  submitting: boolean;
  onBack: () => void;
  onEditIdentity: () => void;
  onEditDelivery: () => void;
  onComplete: () => Promise<void>;
}>;

function ReviewStep(props: ReviewStepProps): ReactElement {
  const [consent, setConsent] = useState(false);
  return (
    <div className="checkoutForm reviewStep">
      <StepHeading icon={<Package size={24} weight="fill" />} label="04 · Revisão" title="Confira antes de concluir." description="Este resumo existe apenas nesta sessão e não será enviado." />
      <ReviewCard title="Identificação" action={props.onEditIdentity}><strong>{props.buyer.name}</strong><span>{props.buyer.email}</span></ReviewCard>
      <ReviewCard title="Entrega" action={props.onEditDelivery}><strong>{props.address.street}, {props.address.number}</strong><span>{props.address.city} · {props.address.state}</span></ReviewCard>
      <ReviewCard title="Pagamento"><strong>Pix demonstrativo</strong><span>Sem QR Code ou cobrança</span></ReviewCard>
      <label className="checkoutConsent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>Entendo que nenhum pedido, pagamento ou envio será criado.</span></label>
      <StepActions back={props.onBack} nextLabel={props.submitting ? "Concluindo simulação…" : "Concluir simulação"} disabled={!consent || props.submitting} onNext={() => void props.onComplete()} />
    </div>
  );
}

function ReviewCard({ title, action, children }: Readonly<{ title: string; action?: () => void; children: ReactNode }>): ReactElement {
  return <section className="reviewCard"><div><span>{title}</span>{action ? <button type="button" onClick={action}>Editar</button> : null}</div><p>{children}</p></section>;
}

type InputFieldProps = Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel";
  inputMode?: "text" | "numeric" | "tel" | "email";
  autoComplete?: string;
  pattern?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}>;

function InputField({ label, value, onChange, type = "text", required = true, ...inputProps }: InputFieldProps): ReactElement {
  return <label className="checkoutField"><span>{label}</span><input {...inputProps} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function StepHeading(props: Readonly<{ icon: ReactElement; label: string; title: string; description: string }>): ReactElement {
  return <header className="checkoutStepHeading"><div>{props.icon}<span className="eyebrow">{props.label}</span></div><h2 tabIndex={-1}>{props.title}</h2><p>{props.description}</p></header>;
}

function IntegrationStatus(props: Readonly<{ name: string; detail: string; enabled: boolean }>): ReactElement {
  return <div className="integrationStatus"><Package size={21} weight="duotone" /><span><strong>{props.name}</strong><small>{props.detail}</small></span><b>{props.enabled ? "Ativo" : "Não conectado"}</b></div>;
}

type StepActionsProps = Readonly<{
  back?: () => void;
  nextLabel: string;
  onNext?: () => void;
  disabled?: boolean;
}>;

function StepActions({ back, nextLabel, onNext, disabled = false }: StepActionsProps): ReactElement {
  return (
    <div className="checkoutActions">{back ? <button className="secondaryAction" type="button" onClick={back}><ArrowLeft size={18} />Voltar</button> : <span />}
      <button className="primaryButton" type={onNext ? "button" : "submit"} onClick={onNext} disabled={disabled}>{nextLabel}<ArrowRight size={19} weight="bold" /></button>
    </div>
  );
}

function CheckoutSummary(props: Readonly<{ quantity: number; subtotal: number; shippingId: ShippingId }>): ReactElement {
  const shipping = shippingById(props.shippingId);
  const total = props.subtotal + shipping.priceCents;
  return (
    <aside className="commerceSummary checkoutSummary"><span className="eyebrow">Resumo demonstrativo</span><div><span>{props.quantity}× {keychainProduct.name}</span><strong>{formatMoney(props.subtotal)}</strong></div><div><span>{shipping.name}</span><strong>{formatMoney(shipping.priceCents)}</strong></div><div className="summaryTotal"><span>Total simulado</span><strong>{formatMoney(total)}</strong></div><small>Valores ilustrativos. Nenhuma transação será iniciada.</small></aside>
  );
}

function EmptyCheckout(): ReactElement {
  return <div className="commerceShell emptyCommerce"><span className="eyebrow">Checkout demonstrativo</span><h1>Seu carrinho está vazio.</h1><p>Adicione o chaveiro antes de iniciar o fluxo.</p><Link className="primaryButton" href="/loja/chaveiro-presente">Voltar ao produto <ArrowRight size={19} /></Link></div>;
}
