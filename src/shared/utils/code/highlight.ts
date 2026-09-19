/**
 * Coloration syntaxique (highlight.js via lowlight), chargée à la demande : ni le moteur ni
 * les grammaires n'alourdissent les pages qui n'affichent aucun code.
 *
 * Le résultat est un arbre de jetons, pas du HTML : le rendu se fait en JSX, sans
 * `dangerouslySetInnerHTML`.
 */

import type { LanguageFn } from "highlight.js";
import { resolveLanguage, type CodeLanguage } from "./language";

/** Texte brut, ou portion colorée (`className` : classes `hljs-*`) contenant d'autres jetons. */
export type CodeToken = string | { className: string; children: CodeToken[] };

/** Au-delà, le code s'affiche sans couleur : on évite de bloquer l'interface. */
const MAX_LENGTH = 20_000;

/** Une grammaire par fichier : le bundler en fait un chunk chargé à la demande. */
const GRAMMARS: Record<CodeLanguage, () => Promise<{ default: LanguageFn }>> = {
  c: () => import("highlight.js/lib/languages/c"),
  cpp: () => import("highlight.js/lib/languages/cpp"),
  csharp: () => import("highlight.js/lib/languages/csharp"),
  java: () => import("highlight.js/lib/languages/java"),
  javascript: () => import("highlight.js/lib/languages/javascript"),
  typescript: () => import("highlight.js/lib/languages/typescript"),
  python: () => import("highlight.js/lib/languages/python"),
  php: () => import("highlight.js/lib/languages/php"),
  go: () => import("highlight.js/lib/languages/go"),
  rust: () => import("highlight.js/lib/languages/rust"),
  kotlin: () => import("highlight.js/lib/languages/kotlin"),
  sql: () => import("highlight.js/lib/languages/sql"),
  bash: () => import("highlight.js/lib/languages/bash"),
  css: () => import("highlight.js/lib/languages/css"),
  xml: () => import("highlight.js/lib/languages/xml"),
  json: () => import("highlight.js/lib/languages/json"),
  yaml: () => import("highlight.js/lib/languages/yaml"),
};

type Lowlight = ReturnType<(typeof import("lowlight"))["createLowlight"]>;

let lowlightPromise: Promise<Lowlight> | undefined;
const grammarPromises = new Map<CodeLanguage, Promise<void>>();

/** Mémorise un chargement réussi ; un échec (réseau) est oublié pour pouvoir réessayer. */
function loadOnce<T>(load: () => Promise<T>, forget: () => void): Promise<T> {
  return load().catch((error: unknown) => {
    forget();
    throw error;
  });
}

function getLowlight(): Promise<Lowlight> {
  lowlightPromise ??= loadOnce(
    () => import("lowlight").then(({ createLowlight }) => createLowlight()),
    () => {
      lowlightPromise = undefined;
    },
  );
  return lowlightPromise;
}

function registerGrammar(lowlight: Lowlight, language: CodeLanguage): Promise<void> {
  let promise = grammarPromises.get(language);
  if (!promise) {
    promise = loadOnce(
      () => GRAMMARS[language]().then((grammar) => lowlight.register(language, grammar.default)),
      () => grammarPromises.delete(language),
    );
    grammarPromises.set(language, promise);
  }
  return promise;
}

/** Nœud de l'arbre lowlight (hast), réduit à ce que l'on lit. */
interface HastNode {
  type: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: readonly HastNode[];
}

function toTokens(nodes: readonly HastNode[]): CodeToken[] {
  return nodes.flatMap((node): CodeToken[] => {
    if (node.type === "text") return node.value ? [node.value] : [];
    if (node.type !== "element") return [];
    const classes = node.properties?.className;
    return [
      {
        className: Array.isArray(classes) ? classes.join(" ") : "",
        children: toTokens(node.children ?? []),
      },
    ];
  });
}

/**
 * Colore un code.
 * @param label - étiquette du bloc (```cpp) ; sinon le langage est déduit du code
 * @returns les jetons, ou `null` pour un affichage sans couleur (langage inconnu, code trop
 *   long, échec de chargement)
 */
export async function highlightCode(code: string, label: string | null): Promise<CodeToken[] | null> {
  if (code.length > MAX_LENGTH) return null;

  const language = resolveLanguage(label, code);
  if (!language) return null;

  try {
    const lowlight = await getLowlight();
    await registerGrammar(lowlight, language);
    return toTokens(lowlight.highlight(language, code).children);
  } catch {
    return null;
  }
}
