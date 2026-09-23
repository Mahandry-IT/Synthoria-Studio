import type { Editor } from "@tiptap/react";

/** Outils de mise en forme de la barre de l'éditeur riche (= nom du nœud / de la marque Tiptap). */
export type RichTextTool = "bold" | "italic" | "strike" | "code" | "bulletList" | "orderedList" | "codeBlock";

/** Mise en forme du texte seulement (champs courts : objectif, sous-thèmes). */
export const INLINE_TOOLS: RichTextTool[] = ["bold", "italic", "strike", "code"];

/** Toute la mise en forme (question, note, explication). */
export const ALL_TOOLS: RichTextTool[] = [...INLINE_TOOLS, "bulletList", "orderedList", "codeBlock"];

/** Applique ou retire la mise en forme d'un outil sur la sélection. */
export function toggleTool(editor: Editor, tool: RichTextTool): void {
  const chain = editor.chain().focus();
  const commands: Record<RichTextTool, () => boolean> = {
    bold: () => chain.toggleBold().run(),
    italic: () => chain.toggleItalic().run(),
    strike: () => chain.toggleStrike().run(),
    code: () => chain.toggleCode().run(),
    bulletList: () => chain.toggleBulletList().run(),
    orderedList: () => chain.toggleOrderedList().run(),
    codeBlock: () => chain.toggleCodeBlock().run(),
  };
  commands[tool]();
}
