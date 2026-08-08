"use client";

import { Plus } from "@phosphor-icons/react/Plus";
import { useEffect, useState } from "react";
import type { Dispatch, FormEvent, ReactElement, SetStateAction } from "react";
import type { AdminProductSummary, ProductDraftInput } from "@/db/admin-contracts";

type Feedback = Readonly<{ kind: "success" | "error"; message: string }>;

const moneyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProductState(value: unknown): value is AdminProductSummary["state"] {
  return value === "draft" || value === "preview" || value === "active" || value === "archived";
}

function isProduct(value: unknown): value is AdminProductSummary {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.slug === "string"
    && typeof value.name === "string" && typeof value.sku === "string"
    && typeof value.priceCents === "number" && isProductState(value.state)
    && typeof value.version === "number";
}

function productsFromPayload(value: unknown): readonly AdminProductSummary[] | null {
  if (!isRecord(value)) return null;
  const products = value.products;
  if (!Array.isArray(products) || !products.every(isProduct)) return null;
  return products;
}

function productFromPayload(value: unknown): AdminProductSummary | null {
  if (!isRecord(value) || !isProduct(value.product)) return null;
  return value.product;
}

function apiError(value: unknown, fallback: string): string {
  if (isRecord(value) && typeof value.error === "string") return value.error;
  return fallback;
}

async function responsePayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    console.error("A resposta do catálogo não pôde ser interpretada.", error);
    return null;
  }
}

async function sendJson(method: "POST" | "PATCH", body: unknown): Promise<Readonly<{ response: Response; payload: unknown }>> {
  const response = await fetch("/api/admin/products", {
    method,
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { response, payload: await responsePayload(response) };
}

async function loadProductList(signal: AbortSignal): Promise<readonly AdminProductSummary[]> {
  const response = await fetch("/api/admin/products", { cache: "no-store", credentials: "same-origin", headers: { Accept: "application/json" }, signal });
  const payload = await responsePayload(response);
  const products = productsFromPayload(payload);
  if (!response.ok || !products) throw new Error(apiError(payload, "Não foi possível carregar os produtos."));
  return products;
}

async function createProduct(form: HTMLFormElement): Promise<AdminProductSummary> {
  const result = await sendJson("POST", productDraft(form));
  if (!result.response.ok) throw new Error(apiError(result.payload, "Não foi possível criar o produto."));
  const product = productFromPayload(result.payload);
  if (!product) throw new Error("O catálogo retornou um produto inválido.");
  return product;
}

async function updateArchived(product: AdminProductSummary, archived: boolean): Promise<void> {
  const result = await sendJson("PATCH", { id: product.id, archived });
  if (!result.response.ok) throw new Error(apiError(result.payload, "Não foi possível atualizar o produto."));
}

function formText(data: FormData, key: string): string {
  return String(data.get(key) ?? "").trim();
}

function productDraft(form: HTMLFormElement): ProductDraftInput {
  const data = new FormData(form);
  const price = Number(formText(data, "price"));
  return {
    name: formText(data, "name"), slug: formText(data, "slug"), sku: formText(data, "sku"),
    collectionName: formText(data, "collectionName"), description: formText(data, "description"),
    imageUrl: formText(data, "imageUrl"), imageAlt: formText(data, "imageAlt"),
    priceCents: Math.round(price * 100),
  };
}

function stateLabel(state: AdminProductSummary["state"]): string {
  if (state === "archived") return "Arquivado";
  if (state === "preview") return "Prévia";
  if (state === "active") return "Ativo";
  return "Rascunho";
}

type ProductRowProps = Readonly<{
  product: AdminProductSummary;
  busy: boolean;
  onArchive: (product: AdminProductSummary) => void;
}>;

function ProductRow({ product, busy, onArchive }: ProductRowProps): ReactElement {
  const archived = product.state === "archived";
  return (
    <article className="adminObjectRow"><div><h3>{product.name}</h3><p>{product.sku} · {moneyFormatter.format(product.priceCents / 100)} · {stateLabel(product.state)}</p></div><button className="adminButton adminButton--danger" type="button" disabled={busy} onClick={() => onArchive(product)}>{busy ? "Salvando…" : archived ? "Restaurar" : "Arquivar"}</button></article>
  );
}

type ProductFormProps = Readonly<{
  busy: boolean;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}>;

function ProductForm({ busy, onCreate, onCancel }: ProductFormProps): ReactElement {
  return (
    <form className="adminInlineForm" onSubmit={onCreate}>
      <div className="adminFieldGrid adminFieldGrid--two">
        <label className="adminField"><span>Nome</span><input name="name" required maxLength={160} placeholder="Produto da comunidade" /></label>
        <label className="adminField"><span>Slug</span><input name="slug" required maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="produto-da-comunidade" /></label>
        <label className="adminField"><span>SKU</span><input name="sku" required maxLength={80} placeholder="COM-DEMO-01" /></label>
        <label className="adminField"><span>Preço ilustrativo (R$)</span><input name="price" required type="number" min="0" max="1000000" step="0.01" inputMode="decimal" placeholder="29,90" /></label>
        <label className="adminField"><span>Linha</span><input name="collectionName" required maxLength={160} placeholder="Loja da comunidade" /></label>
        <label className="adminField"><span>Caminho ou URL da imagem</span><input name="imageUrl" required maxLength={500} placeholder="/images/products/produto.png" /></label>
      </div>
      <div className="adminFieldGrid" style={{ marginTop: 14 }}>
        <label className="adminField"><span>Descrição</span><textarea name="description" required maxLength={2000} placeholder="Conte a história do produto para a comunidade." /></label>
        <label className="adminField"><span>Texto alternativo da imagem</span><input name="imageAlt" required maxLength={240} placeholder="Descreva o produto sem repetir o nome." /><small>Upload R2 ainda não está disponível; use somente imagem pública.</small></label>
      </div>
      <div className="adminFormActions"><button className="adminButton adminButton--primary" type="submit" disabled={busy}>{busy ? "Criando…" : "Criar rascunho"}</button><button className="adminButton adminButton--secondary" type="button" disabled={busy} onClick={onCancel}>Cancelar</button></div>
    </form>
  );
}

function FeedbackMessage({ feedback }: Readonly<{ feedback: Feedback | null }>): ReactElement | null {
  if (!feedback) return null;
  const style = feedback.kind === "error" ? { color: "#ffaaaa" } : undefined;
  return <span className="mockFeedback" role={feedback.kind === "error" ? "alert" : "status"} style={style}>{feedback.message}</span>;
}

type ProductSetter = Dispatch<SetStateAction<readonly AdminProductSummary[]>>;
type FeedbackSetter = Dispatch<SetStateAction<Feedback | null>>;

function useProductList(): Readonly<{
  products: readonly AdminProductSummary[];
  setProducts: ProductSetter;
  loading: boolean;
  feedback: Feedback | null;
  setFeedback: FeedbackSetter;
}> {
  const [products, setProducts] = useState<readonly AdminProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load(): Promise<void> {
      try {
        setProducts(await loadProductList(controller.signal));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Falha ao carregar catálogo administrativo.", error);
        setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível carregar os produtos." });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);
  return { products, setProducts, loading, feedback, setFeedback };
}

function useProductCreation(setProducts: ProductSetter, setFeedback: FeedbackSetter): Readonly<{
  formOpen: boolean;
  creating: boolean;
  openForm: () => void;
  closeForm: () => void;
  addDraft: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}> {
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  async function addDraft(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setCreating(true); setFeedback(null);
    try {
      const product = await createProduct(event.currentTarget);
      setProducts((current) => [product, ...current]); setFormOpen(false);
      setFeedback({ kind: "success", message: `${product.name} foi salvo como rascunho.` });
    } catch (error) {
      console.error("Falha ao criar produto.", error);
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível criar o produto." });
    } finally {
      setCreating(false);
    }
  }
  const openForm = () => { setFormOpen(true); setFeedback(null); };
  return { formOpen, creating, openForm, closeForm: () => setFormOpen(false), addDraft };
}

function useProductArchiving(setProducts: ProductSetter, setFeedback: FeedbackSetter): Readonly<{
  busyProductId: string | null;
  toggleArchive: (product: AdminProductSummary) => Promise<void>;
}> {
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  async function toggleArchive(product: AdminProductSummary): Promise<void> {
    const archived = product.state !== "archived";
    setBusyProductId(product.id); setFeedback(null);
    try {
      await updateArchived(product, archived);
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, state: archived ? "archived" : "draft", version: item.version + 1 } : item));
      setFeedback({ kind: "success", message: archived ? `${product.name} foi arquivado.` : `${product.name} voltou para rascunho.` });
    } catch (error) {
      console.error("Falha ao alterar estado do produto.", error);
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível atualizar o produto." });
    } finally {
      setBusyProductId(null);
    }
  }
  return { busyProductId, toggleArchive };
}

export function ProductsManager(): ReactElement {
  const list = useProductList();
  const creation = useProductCreation(list.setProducts, list.setFeedback);
  const archiving = useProductArchiving(list.setProducts, list.setFeedback);

  return (
    <div className="adminCard"><div className="adminObjectList">{list.loading ? <div className="adminEmpty" role="status"><strong>Carregando produtos…</strong></div> : list.products.length ? list.products.map((product) => <ProductRow product={product} busy={archiving.busyProductId === product.id} onArchive={archiving.toggleArchive} key={product.id} />) : <div className="adminEmpty"><span>0</span><strong>Nenhum produto cadastrado</strong><p>Crie um rascunho para iniciar o catálogo do CMS.</p></div>}</div>{creation.formOpen ? <ProductForm busy={creation.creating} onCreate={creation.addDraft} onCancel={creation.closeForm} /> : null}<div className="adminFormActions">{!creation.formOpen ? <button className="adminButton adminButton--primary" type="button" disabled={list.loading} onClick={creation.openForm}><Plus size={18} weight="bold" />Adicionar produto</button> : null}<FeedbackMessage feedback={list.feedback} /></div></div>
  );
}
