/**
 * Markdown des saisies riches (éditeur Tiptap) : normalisation, texte brut et sous-thèmes.
 * Le Markdown est envoyé tel quel au backend, qui le transmet à Gemini.
 */

const ENTITIES: Record<string, string> = { "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"', "&#39;": "'" };
const ENTITY_PATTERN = /&(?:lt|gt|amp|quot|#39);/g;
const MATH_SEGMENT = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g;
// Marqueur seul (puce vide « - ») compris : il ne doit pas devenir un sous-thème
const LIST_MARKER = /^\s*(?:[-*+]|\d+[.)])(?:\s+|$)/;

/**
 * Corrige la sérialisation de l'éditeur pour qu'elle reste fidèle à la saisie :
 * - entités HTML (`&lt;`…) décodées : « a < b » doit arriver tel quel au modèle ;
 * - `\_` inutile retiré après une lettre/un chiffre (x_1, snake_case : jamais une emphase)
 *   et, avec `\\` et `\*`, dans les formules `$...$` que l'échappement casserait (\frac…).
 */
export function normalizeEditorMarkdown(markdown: string): string {
  return markdown
    .replace(ENTITY_PATTERN, (entity) => ENTITIES[entity] ?? entity)
    .replace(MATH_SEGMENT, (segment) => segment.replace(/\\([_*\\])/g, "$1"))
    .replace(/(?<=[\p{L}\p{N}])\\_/gu, "_")
    .trim();
}

/** Texte brut d'un Markdown de saisie (aperçus d'une ligne : historique, plans en attente). */
export function markdownToPlain(markdown: string): string {
  return markdown
    .replace(/^\s*(```|~~~).*$/gm, "")
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(\*\*|__)(?=\S)(.+?)(?<=\S)\1/g, "$2")
    .replace(/~~(?=\S)(.+?)(?<=\S)~~/g, "$1")
    .replace(/(?<![\w*])\*(?=\S)(.+?)(?<=\S)\*(?![\w*])/g, "$1")
    .replace(/(?<!\w)_(?=\S)(.+?)(?<=\S)_(?!\w)/g, "$1")
    .replace(/\\([\\`*_{}[\]()#+\-.!~|>])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sous-thèmes → liste à puces Markdown (contenu de l'éditeur des sous-thèmes). */
export function subtopicsToMarkdown(subtopics: string[]): string {
  return subtopics.map((topic) => `- ${topic}`).join("\n");
}

/** Liste Markdown (ou lignes libres) → sous-thèmes : une puce ou une ligne = un sous-thème. */
export function subtopicsFromMarkdown(markdown: string): string[] {
  return markdown
    .split("\n")
    .map((line) => line.replace(LIST_MARKER, "").trim())
    .filter(Boolean);
}
