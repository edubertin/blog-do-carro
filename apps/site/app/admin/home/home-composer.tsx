"use client";

import { ArrowDown } from "@phosphor-icons/react/ArrowDown";
import { ArrowUp } from "@phosphor-icons/react/ArrowUp";
import { useState } from "react";
import type { ReactElement } from "react";
import { homeSections } from "../admin-data";
import { MockAction } from "../mock-action";

function moveItem<T>(items: readonly T[], index: number, offset: number): T[] {
  const target = index + offset;
  if (target < 0 || target >= items.length) return [...items];
  const next = [...items];
  const current = next[index];
  const replacement = next[target];
  if (current === undefined || replacement === undefined) return next;
  next[index] = replacement;
  next[target] = current;
  return next;
}

export function HomeComposer(): ReactElement {
  const [sections, setSections] = useState(() => [...homeSections]);
  return (
    <div className="adminCard"><div className="adminObjectList">{sections.map((section, index) => <article className="adminQueueItem" key={section.name}><span className="adminQueueIndex">{String(index + 1).padStart(2, "0")}</span><div><h3>{section.name}</h3><p>{section.detail} · {section.status}</p></div><div className="adminRowActions"><button type="button" aria-label={`Mover ${section.name} para cima`} disabled={index === 0} onClick={() => setSections((current) => moveItem(current, index, -1))}><ArrowUp size={17} /></button><button type="button" aria-label={`Mover ${section.name} para baixo`} disabled={index === sections.length - 1} onClick={() => setSections((current) => moveItem(current, index, 1))}><ArrowDown size={17} /></button></div></article>)}</div><div className="adminFormActions"><button className="adminButton adminButton--secondary" type="button" onClick={() => setSections([...homeSections])}>Restaurar ordem</button><MockAction label="Salvar composição" message="Ordem simulada. O portal público não foi alterado." variant="primary" /></div></div>
  );
}
