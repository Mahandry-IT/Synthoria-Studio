"use client";

import { EditorContent } from "@tiptap/react";
import { useMarkdownEditor } from "@/shared/hooks/useMarkdownEditor";
import { ALL_TOOLS, type RichTextTool } from "./richTextTools";
import { RichTextToolbar } from "./RichTextToolbar";

interface RichTextEditorProps {
  /** Contenu Markdown (contrôlé). */
  value: string;
  onChange: (markdown: string) => void;
  /** Nom accessible de la zone de saisie (le contenu éditable n'est pas lié à un <label>). */
  ariaLabel: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Bordure rouge (limite dépassée, erreur de validation). */
  invalid?: boolean;
  tools?: RichTextTool[];
  /** Contenu d'office une liste à puces (une puce = un élément). */
  bulletList?: boolean;
  /** Hauteur minimale de la zone de saisie, en lignes. */
  minRows?: number;
}

/**
 * Champ de saisie riche (Tiptap) : barre d'outils + zone éditable qui grandit avec son contenu.
 * La valeur échangée est du Markdown, envoyée telle quelle au backend.
 */
export function RichTextEditor({
  value,
  onChange,
  ariaLabel,
  id,
  placeholder,
  disabled = false,
  autoFocus = false,
  invalid = false,
  tools = ALL_TOOLS,
  bulletList = false,
  minRows = 2,
}: RichTextEditorProps) {
  const editor = useMarkdownEditor({
    value,
    onChange,
    bulletList,
    placeholder,
    disabled,
    autoFocus,
    attributes: {
      ...(id ? { id } : {}),
      "aria-label": ariaLabel,
      ...(invalid ? { "aria-invalid": "true" } : {}),
      class: "rich-text px-3 py-2 text-sm focus:outline-none",
      style: `min-height: ${minRows * 1.5 + 1}rem`,
    },
  });

  return (
    <div
      className={[
        "overflow-hidden rounded-lg border bg-white",
        "focus-within:ring-2",
        invalid ? "border-red-300 focus-within:ring-red-500" : "border-gray-300 focus-within:border-indigo-500 focus-within:ring-indigo-500",
        disabled ? "opacity-50" : "",
      ].join(" ")}
    >
      {editor && <RichTextToolbar editor={editor} tools={tools} disabled={disabled} />}
      <EditorContent editor={editor} />
    </div>
  );
}
