"use client";

import { Plus } from "@phosphor-icons/react/Plus";
import { useState } from "react";
import type { FormEvent, ReactElement } from "react";

type ProductFixture = Readonly<{ id: string; name: string; sku: string; price: string; stock: string; status: "Ativo no mock" | "Rascunho" | "Arquivado" }>;

const initialProducts: readonly ProductFixture[] = [
  { id: "chaveiro-presente", name: "Chaveiro Presente", sku: "CHP-DEMO-01", price: "R$ 29,90", stock: "20 un. ilustrativas", status: "Ativo no mock" },
];

function ProductRow({ product, onArchive }: Readonly<{ product: ProductFixture; onArchive: (id: string) => void }>): ReactElement {
  return <article className="adminObjectRow"><div><h3>{product.name}</h3><p>{product.sku} · {product.price} · {product.stock} · {product.status}</p></div><button className="adminButton adminButton--danger" type="button" onClick={() => onArchive(product.id)}>{product.status === "Arquivado" ? "Restaurar" : "Arquivar"}</button></article>;
}

function ProductForm({ onCreate, onCancel }: Readonly<{ onCreate: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }>): ReactElement {
  return <form className="adminInlineForm" onSubmit={onCreate}><div className="adminFieldGrid adminFieldGrid--two"><label className="adminField"><span>Nome</span><input name="name" required placeholder="Produto da comunidade" /></label><label className="adminField"><span>SKU</span><input name="sku" required placeholder="COM-DEMO-01" /></label><label className="adminField"><span>Preço demonstrativo</span><input name="price" required placeholder="R$ 29,90" /></label><label className="adminField"><span>Estoque ilustrativo</span><input name="stock" required type="number" min="0" placeholder="20" /></label><label className="adminField"><span>Imagem local</span><input name="image" type="file" accept="image/png,image/jpeg,image/webp" /></label></div><div className="adminFormActions"><button className="adminButton adminButton--primary" type="submit">Criar rascunho</button><button className="adminButton adminButton--secondary" type="button" onClick={onCancel}>Cancelar</button></div></form>;
}

function draftFromForm(form: HTMLFormElement, sequence: number): ProductFixture | null {
  const data = new FormData(form);
  const name = String(data.get("name") ?? "").trim();
  const sku = String(data.get("sku") ?? "").trim();
  const price = String(data.get("price") ?? "").trim();
  const stock = String(data.get("stock") ?? "0").trim();
  if (!name || !sku || !price) return null;
  return { id: `draft-${sequence}`, name, sku, price, stock: `${stock} un. ilustrativas`, status: "Rascunho" };
}

export function ProductsManager(): ReactElement {
  const [products, setProducts] = useState(() => [...initialProducts]);
  const [formOpen, setFormOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const addDraft = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const product = draftFromForm(event.currentTarget, products.length + 1); if (!product) return; setProducts((current) => [...current, product]); setFeedback(`${product.name} foi adicionado apenas a esta tela.`); setFormOpen(false); };
  const toggleArchive = (id: string) => setProducts((current) => current.map((item) => item.id === id ? { ...item, status: item.status === "Arquivado" ? "Rascunho" : "Arquivado" } : item));
  const restore = () => { setProducts([...initialProducts]); setFeedback("Fixtures restauradas."); setFormOpen(false); };
  return <div className="adminCard"><div className="adminObjectList">{products.map((product) => <ProductRow product={product} onArchive={toggleArchive} key={product.id} />)}</div>{formOpen ? <ProductForm onCreate={addDraft} onCancel={() => setFormOpen(false)} /> : null}<div className="adminFormActions"><button className="adminButton adminButton--primary" type="button" onClick={() => setFormOpen(true)}><Plus size={18} weight="bold" />Adicionar produto</button><button className="adminButton adminButton--secondary" type="button" onClick={restore}>Restaurar fixtures</button>{feedback ? <span className="mockFeedback" role="status">{feedback}</span> : null}</div></div>;
}
