"use client";

import { Extension, Node, mergeAttributes } from "@tiptap/core";
import type { Editor, JSONContent } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, MouseEvent, PointerEvent, ReactElement } from "react";
import type { ArticleContentDocument } from "@/domain/article-content";
import { articleDocumentToTiptap, tiptapToArticleDocument } from "@/domain/tiptap-article-adapter";
import "./continuous-article-editor.css";

export type ArticleImageUpload = Readonly<{ assetId: string; width: number; height: number }>;

export type ContinuousArticleEditorProps = Readonly<{
  initialDocument: ArticleContentDocument;
  onChange: (document: ArticleContentDocument) => void;
  onUpload: (file: File, alt: string) => Promise<ArticleImageUpload>;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}>;

type MediaForm = Readonly<{ alt: string; caption: string; alignment: "inline" | "wide" }>;
const EMPTY_MEDIA: MediaForm = { alt: "", caption: "", alignment: "inline" };
const IMAGE_EDIT_EVENT = "blog-do-carro:edit-article-image";

const ArticleAttributes = Extension.create({
  name: "articleAttributes",
  addGlobalAttributes() {
    return [{ types: ["paragraph", "heading"], attributes: { id: { default: null, rendered: false } } }];
  },
});

function ArticleImageView({ editor, getPos, node, selected }: NodeViewProps): ReactElement {
  const attrs: Record<string, unknown> = node.attrs;
  const selectImage = (): void => {
    const position = getPos();
    if (typeof position !== "number") return;
    editor.commands.setNodeSelection(position);
    window.dispatchEvent(new Event(IMAGE_EDIT_EVENT));
  };
  const preserveButton = (event: PointerEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    selectImage();
  };
  const openImage = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    selectImage();
  };
  const openImageWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    selectImage();
  };
  return <NodeViewWrapper as="figure" data-alignment={attrs.alignment} className={selected ? "is-selected" : ""}>
    {/* O preview autenticado do R2 precisa evitar o otimizador público do Next. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`/api/admin/media/${String(attrs.assetId)}`} alt={String(attrs.alt)} />
    {attrs.caption ? <figcaption>{String(attrs.caption)}</figcaption> : null}
    <button type="button" className="continuousEditor__imageSelect" onPointerDown={preserveButton} onClick={openImage} onKeyDown={openImageWithKeyboard} onFocus={selectImage}>Editar imagem</button>
  </NodeViewWrapper>;
}

const ArticleImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  selectable: true,
  addNodeView() { return ReactNodeViewRenderer(ArticleImageView); },
  addAttributes() {
    return {
      id: { default: null, rendered: false }, assetId: { default: null, rendered: false },
      alt: { default: "", rendered: false }, caption: { default: "", rendered: false },
      alignment: { default: "inline", rendered: false }, width: { default: null, rendered: false },
      height: { default: null, rendered: false },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const attrs: Record<string, unknown> = node.attrs;
    const image = ["img", { src: `/api/admin/media/${String(attrs.assetId)}`, alt: String(attrs.alt) }];
    const caption = attrs.caption ? ["figcaption", {}, String(attrs.caption)] : ["span", { hidden: "" }, ""];
    return ["figure", mergeAttributes(HTMLAttributes, { "data-alignment": attrs.alignment }), image, caption];
  },
});

function editorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] }, blockquote: false, bold: false, bulletList: false,
      code: false, codeBlock: false, hardBreak: false, horizontalRule: false,
      italic: false, link: false, listItem: false, orderedList: false, strike: false,
      underline: false,
    }),
    ArticleAttributes, ArticleImage,
    Placeholder.configure({ placeholder: "Comece a escrever. Use a barra acima para inserir uma imagem onde estiver o cursor." }),
  ];
}

function ensureNodeIds(editor: Editor): boolean {
  let changed = false;
  const transaction = editor.state.tr;
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === "text" || typeof node.attrs.id === "string") return;
    transaction.setNodeMarkup(position, undefined, { ...node.attrs, id: crypto.randomUUID() });
    changed = true;
  });
  if (changed) editor.view.dispatch(transaction);
  return changed;
}

function notifyDocument(editor: Editor, onChange: ContinuousArticleEditorProps["onChange"]): void {
  if (ensureNodeIds(editor)) return;
  onChange(tiptapToArticleDocument(editor.getJSON()));
}

function mediaFormFromAttrs(attrs: Record<string, unknown>): MediaForm {
  return {
    alt: typeof attrs.alt === "string" ? attrs.alt : "",
    caption: typeof attrs.caption === "string" ? attrs.caption : "",
    alignment: attrs.alignment === "wide" ? "wide" : "inline",
  };
}

function selectedImage(editor: Editor | null): MediaForm | null {
  if (!editor?.isActive("image")) return null;
  return mediaFormFromAttrs(editor.getAttributes("image"));
}

function Toolbar({ editor, onImage }: Readonly<{ editor: Editor; onImage: () => void }>): ReactElement {
  const format = (level?: 2 | 3) => level
    ? editor.chain().focus().toggleHeading({ level }).run()
    : editor.chain().focus().setParagraph().run();
  const preserveSelection = (event: PointerEvent<HTMLButtonElement>): void => event.preventDefault();
  return <div className="continuousEditor__toolbar" role="toolbar" aria-label="Formatação do artigo">
    <button type="button" className="continuousEditor__tool" aria-pressed={editor.isActive("paragraph")} onPointerDown={preserveSelection} onClick={() => format()}>Texto</button>
    <button type="button" className="continuousEditor__tool" aria-pressed={editor.isActive("heading", { level: 2 })} onPointerDown={preserveSelection} onClick={() => format(2)}>Título 2</button>
    <button type="button" className="continuousEditor__tool" aria-pressed={editor.isActive("heading", { level: 3 })} onPointerDown={preserveSelection} onClick={() => format(3)}>Título 3</button>
    <button type="button" className="continuousEditor__tool" onClick={onImage}>{editor.isActive("image") ? "Editar imagem" : "+ Imagem"}</button>
  </div>;
}

type MediaPanelProps = Readonly<{
  form: MediaForm; busy: boolean; editing: boolean; error: string | null;
  onChange: (form: MediaForm) => void; onFile: (file: File) => void;
  onApply: () => void; onRemove: () => void; onClose: () => void;
}>;

function MediaPanel(props: MediaPanelProps): ReactElement {
  const chooseFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.currentTarget.files?.[0]; event.currentTarget.value = "";
    if (file) props.onFile(file);
  };
  return <section className="continuousEditor__mediaPanel" aria-label={props.editing ? "Editar imagem" : "Inserir imagem"}>
    <label><span>Descrição acessível</span><input value={props.form.alt} minLength={5} maxLength={240} disabled={props.busy} onChange={(event) => props.onChange({ ...props.form, alt: event.currentTarget.value })} placeholder="Descreva o que aparece na imagem" /></label>
    <label><span>Legenda opcional</span><input value={props.form.caption} maxLength={300} disabled={props.busy} onChange={(event) => props.onChange({ ...props.form, caption: event.currentTarget.value })} /></label>
    {props.editing ? <label><span>Largura</span><select value={props.form.alignment} disabled={props.busy} onChange={(event) => props.onChange({ ...props.form, alignment: event.currentTarget.value === "wide" ? "wide" : "inline" })}><option value="inline">No texto</option><option value="wide">Destaque</option></select></label> : null}
    <p className="continuousEditor__hint">JPEG, PNG ou WebP. A imagem será colocada exatamente na posição selecionada.</p>
    {props.error ? <p className="continuousEditor__error" role="alert">{props.error}</p> : null}
    <div className="continuousEditor__mediaActions">
      {props.editing ? <button type="button" className="continuousEditor__tool" disabled={props.busy} onClick={props.onApply}>Aplicar alterações</button> : null}
      <label className="continuousEditor__fileControl"><input className="continuousEditor__fileInput" type="file" accept="image/jpeg,image/png,image/webp" disabled={props.busy || props.form.alt.trim().length < 5} aria-label={props.editing ? "Substituir arquivo da imagem" : "Escolher imagem para inserir"} onChange={chooseFile} /><span className="continuousEditor__tool" aria-hidden="true">{props.busy ? "Enviando…" : props.editing ? "Substituir arquivo" : "Escolher arquivo"}</span></label>
      {props.editing ? <button type="button" className="continuousEditor__tool" disabled={props.busy} onClick={props.onRemove}>Remover imagem</button> : null}
      <button type="button" className="continuousEditor__tool" disabled={props.busy} onClick={props.onClose}>Fechar</button>
    </div>
  </section>;
}

function insertImageNode(editor: Editor, upload: ArticleImageUpload, form: MediaForm): void {
  const content: JSONContent[] = [
    { type: "image", attrs: { id: crypto.randomUUID(), ...upload, alt: form.alt.trim(), caption: form.caption.trim(), alignment: form.alignment } },
    { type: "paragraph", attrs: { id: crypto.randomUUID() } },
  ];
  editor.chain().focus().insertContent(content).run();
}

export function ContinuousArticleEditor(props: ContinuousArticleEditorProps): ReactElement {
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState<MediaForm>(EMPTY_MEDIA);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSelection, setImageSelection] = useState<MediaForm | null>(null);
  const selectionRef = useRef<number | null>(null);
  const editor = useEditor({
    extensions: editorExtensions(), content: articleDocumentToTiptap(props.initialDocument) as JSONContent,
    immediatelyRender: false, editable: !props.disabled,
    editorProps: {
      attributes: { "aria-label": "Conteúdo do artigo", role: "textbox" },
      handleClickOn(view, _position, node, nodePosition) {
        if (node.type.name !== "image") return false;
        view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, nodePosition)));
        const nextForm = mediaFormFromAttrs(node.attrs);
        setImageSelection(nextForm);
        setForm(nextForm);
        setError(null);
        setPanelOpen(true);
        view.focus();
        return true;
      },
    },
    onCreate: ({ editor: current }) => notifyDocument(current, props.onChange),
    onUpdate: ({ editor: current }) => notifyDocument(current, props.onChange),
    onSelectionUpdate: ({ editor: current }) => setImageSelection(selectedImage(current)),
  });
  useEffect(() => { editor?.setEditable(!props.disabled && !panelOpen && !busy); }, [busy, editor, panelOpen, props.disabled]);
  useEffect(() => {
    const openSelectedImage = (): void => {
      const selected = selectedImage(editor);
      if (!editor || !selected) return;
      selectionRef.current = editor.state.selection.from;
      setImageSelection(selected); setForm(selected); setError(null); setPanelOpen(true);
    };
    window.addEventListener(IMAGE_EDIT_EVENT, openSelectedImage);
    return () => window.removeEventListener(IMAGE_EDIT_EVENT, openSelectedImage);
  }, [editor]);
  const editing = imageSelection;
  function openPanel(): void {
    if (!editor) return;
    selectionRef.current = editor.state.selection.from;
    setForm(imageSelection ?? EMPTY_MEDIA); setError(null); setPanelOpen(true);
  }
  function closePanel(): void {
    setPanelOpen(false);
    setError(null);
    requestAnimationFrame(() => editor?.chain().focus().run());
  }
  async function upload(file: File): Promise<void> {
    if (!editor || form.alt.trim().length < 5) { setError("Descreva a imagem com pelo menos 5 caracteres."); return; }
    try {
      setBusy(true); props.onUploadingChange?.(true); setError(null);
      const result = await props.onUpload(file, form.alt.trim());
      if (editing) editor.chain().focus().updateAttributes("image", { ...result, ...form }).run();
      else { if (selectionRef.current !== null) editor.commands.setTextSelection(selectionRef.current); insertImageNode(editor, result, form); }
      closePanel();
    } catch (uploadError) {
      console.error("Falha ao enviar imagem do artigo.", uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "Não foi possível enviar a imagem.");
    } finally { setBusy(false); props.onUploadingChange?.(false); }
  }
  function applyImage(): void { editor?.chain().focus().updateAttributes("image", form).run(); closePanel(); }
  function removeImage(): void { editor?.chain().focus().deleteSelection().run(); closePanel(); }
  return <div className="continuousEditor">
    {editor ? <Toolbar editor={editor} onImage={openPanel} /> : null}
    <div className="continuousEditor__canvas"><EditorContent editor={editor} className="continuousEditor__content" /></div>
    {panelOpen ? <MediaPanel form={form} busy={busy} editing={editing !== null} error={error} onChange={setForm} onFile={(file) => void upload(file)} onApply={applyImage} onRemove={removeImage} onClose={closePanel} /> : null}
  </div>;
}
