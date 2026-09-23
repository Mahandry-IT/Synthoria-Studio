"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { markdownToPlain } from "@/shared/utils/markdown";

interface RichTextViewProps {
  /** Markdown issu d'un éditeur riche (question, note…). */
  markdown: string;
  className?: string;
}

/** Affichage en lecture seule d'une saisie riche, avec le même rendu que dans l'éditeur. */
export function RichTextView({ markdown, className = "" }: RichTextViewProps) {
  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: false,
      extensions: [StarterKit, Markdown],
      content: markdown,
      contentType: "markdown",
      editorProps: { attributes: { class: `rich-text ${className}` } },
    },
    [markdown],
  );

  // Avant montage de l'éditeur (rendu serveur) : le texte brut, pour ne pas afficher de vide
  if (!editor) return <p className={className}>{markdownToPlain(markdown)}</p>;
  return <EditorContent editor={editor} />;
}
