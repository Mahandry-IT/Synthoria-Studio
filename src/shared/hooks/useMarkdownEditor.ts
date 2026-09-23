"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Placeholder } from "@tiptap/extensions";
import { normalizeEditorMarkdown } from "@/shared/utils/markdown";

interface UseMarkdownEditorOptions {
  /** Contenu Markdown (contrôlé). */
  value: string;
  onChange: (markdown: string) => void;
  /** Contenu d'office une liste à puces (sous-thèmes : une puce = un élément). */
  bulletList?: boolean;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Attributs de la zone éditable (id, aria-label, classes…). */
  attributes?: Record<string, string>;
}

/**
 * Éditeur Tiptap dont la valeur est du Markdown : gras, italique, barré, code, listes, blocs de code.
 * Pas de titres, citations ni liens : la saisie reste un texte d'apprenant, pas un document.
 * Une valeur changée de l'extérieur (reset, complétion IA) remplace le contenu sans renvoyer d'onChange.
 */
export function useMarkdownEditor({
  value,
  onChange,
  bulletList = false,
  placeholder,
  disabled = false,
  autoFocus = false,
  attributes,
}: UseMarkdownEditorOptions) {
  // Dernière valeur émise ou appliquée : évite de réinjecter ce que l'éditeur vient de produire
  const lastValue = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, blockquote: false, horizontalRule: false, link: false, underline: false }),
      Markdown,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value || (bulletList ? "- " : ""),
    contentType: "markdown",
    editable: !disabled,
    autofocus: autoFocus ? "end" : false,
    editorProps: { attributes: { role: "textbox", "aria-multiline": "true", ...attributes } },
    onUpdate: ({ editor: current }) => {
      const markdown = normalizeEditorMarkdown(current.getMarkdown());
      lastValue.current = markdown;
      onChangeRef.current(markdown);
    },
  });

  useEffect(() => {
    if (!editor || value === lastValue.current) return;
    lastValue.current = value;
    editor.commands.setContent(value || (bulletList ? "- " : ""), { contentType: "markdown", emitUpdate: false });
  }, [editor, value, bulletList]);

  useEffect(() => {
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);

  return editor;
}
