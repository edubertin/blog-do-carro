"use client";

import { useState } from "react";
import type { ReactElement } from "react";

type MenuItem = Readonly<{ label: string; href: string; visible: boolean }>;

const initialItems: readonly MenuItem[] = [
  { label: "Início", href: "/", visible: true },
  { label: "Artigos", href: "/#ultimos", visible: true },
  { label: "Categorias", href: "/#categorias", visible: true },
  { label: "Loja", href: "/loja", visible: true },
  { label: "Sobre", href: "/sobre", visible: true },
  { label: "Contato", href: "/contato", visible: true },
  { label: "Marketplace", href: "/marketplace", visible: false },
];

export function MenuComposer(): ReactElement {
  const [items, setItems] = useState(() => [...initialItems]);
  const toggleItem = (href: string) => setItems((current) => current.map((item) => item.href === href ? { ...item, visible: !item.visible } : item));
  return <div className="adminCard"><div className="adminObjectList">{items.map((item) => <article className="adminObjectRow" key={item.href}><div><h3>{item.label}</h3><p>{item.href}</p></div><button className={item.visible ? "adminToggle isOn" : "adminToggle"} type="button" role="switch" aria-checked={item.visible} onClick={() => toggleItem(item.href)}><span aria-hidden="true" /><b>{item.visible ? "Visível" : "Oculto"}</b></button></article>)}</div><p className="adminCallout" style={{ marginTop: 16 }}><strong>Mock:</strong> alternar um item não muda a navegação pública e não grava preferência no navegador.</p></div>;
}
