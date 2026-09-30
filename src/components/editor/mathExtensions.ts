import { InputRule } from "@tiptap/core";
import { BlockMath, InlineMath } from "@tiptap/extension-mathematics";
import "katex/dist/katex.min.css";

const KATEX_OPTIONS = { throwOnError: false, strict: false };

/**
 * Formule `$...$` : tapée dans l'éditeur, elle se transforme en formule rendue à la frappe du `$` fermant.
 * Retour arrière juste après elle : elle redevient du texte `$formule` (sans `$` fermant) à corriger,
 * puis se re-rend quand on retape le `$`.
 */
const EditableInlineMath = InlineMath.extend({
  addInputRules() {
    return [
      ...(this.parent?.() ?? []),
      new InputRule({
        find: /(?<![$\\])\$([^$\n]+)\$$/,
        handler: ({ state, range, match }) => {
          const latex = match[1].trim();
          if (!latex) return;
          state.tr.replaceWith(range.from, range.to, this.type.create({ latex }));
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        const before = selection.empty ? selection.$from.nodeBefore : null;
        if (before?.type !== this.type) return false;
        return editor
          .chain()
          .insertContentAt({ from: selection.from - before.nodeSize, to: selection.from }, `$${before.attrs.latex}`)
          .run();
      },
    };
  },
});

/** Formules LaTeX (KaTeX) de l'éditeur riche : `$...$` en ligne et `$$...$$` en bloc, sérialisées en Markdown. */
export const mathExtensions = [
  BlockMath.configure({ katexOptions: { ...KATEX_OPTIONS, displayMode: true } }),
  EditableInlineMath.configure({ katexOptions: KATEX_OPTIONS }),
];
