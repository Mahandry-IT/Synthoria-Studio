"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { repairLatexEscapes, splitBareMath } from "./mathNotation";

/** Segments mathématiques : `$$...$$` (display) puis `$...$` (inline). */
const MATH_SEGMENT_SOURCE = String.raw`\$\$[\s\S]+?\$\$|\$[^$\n]+?\$`;

/** Retire les segments mathématiques (pour détecter des séparateurs hors formules). */
export function stripMath(text: string): string {
  return text.replace(new RegExp(MATH_SEGMENT_SOURCE, "g"), "");
}

/** Commande LaTeX (`\frac`, `\lim`…) ou indice/exposant : signal fort de vraie formule. */
const LATEX_SYNTAX = /\\[a-zA-Z]+|[_^]/;

/**
 * Garde de sécurité : détermine si un candidate LaTeX semble être
 * du vrai math ou de la prose capturée accidentellement entre deux `$`.
 *
 * Rejette (→ rendu texte brut) si le candidate contient :
 * - des symboles monétaires isolés (`€ £ ¥`) hors `\text{}`
 * - de la ponctuation de phrase interne (`.`, `!`, `?`) hors `\text{}`
 * - plus de ~80 caractères avec plusieurs espaces (prose), sauf si la syntaxe
 *   LaTeX est présente (une formule longue n'est pas de la prose)
 *
 * @see plan-sync-frontend-backend.md — étape 6
 */
function isLikelyMath(candidate: string): boolean {
  const trimmed = candidate.trim();

  // On retire les \text{...} avant de tester
  const stripped = trimmed.replace(/\\text\{[^}]*\}/g, "");
  if (/[€£¥]/.test(stripped)) return false;

  // Ponctuation de phrase interne (pas en début/fin)
  if (/[.!?][a-zA-ZÀ-ÿ]/.test(stripped)) return false;

  // Prose : > ~80 caractères avec plusieurs espaces
  const looksLikeProse =
    trimmed.length > 80 && (trimmed.match(/\s/g)?.length ?? 0) > 3;
  if (looksLikeProse && !LATEX_SYNTAX.test(trimmed)) return false;

  return true;
}

/**
 * Échappe les caractères spéciaux pour KaTeX.
 */
function escapeKatexText(text: string): string {
  return text
    .replace(/€/g, "\\euro ")
    .replace(/£/g, "\\pounds ")
    .replace(/©/g, "\\copyright ")
    .replace(/®/g, "\\textregistered ")
    .replace(/™/g, "\\texttrademark ")
    .replace(/°/g, "\\degree ")
    .replace(/§/g, "\\S ");
}

/**
 * Détecte si le texte contient un tableau structuré avec des séparateurs `|`.
 * Retourne les lignes du tableau ou null si pas un tableau.
 */
function detectTable(text: string): string[][] | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  // `|` dans une formule ($|x|$, array{c|c}) n'est pas un séparateur de colonnes
  const hasMultiCol =
    stripMath(text).split("\n").filter((l) => l.includes("|")).length >= 2;
  if (!hasMultiCol) return null;

  const rows = lines.map((line) =>
    line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean)
  );

  // Toutes les lignes doivent avoir au moins 2 colonnes
  const validRows = rows.filter((r) => r.length >= 2);
  if (validRows.length < 2) return null;

  return validRows;
}

/**
 * Parse le texte markdown pour extraire le gras **text**.
 * Retourne un DocumentFragment avec des <strong> aux bons endroits.
 */
function parseBoldMarkdown(
  text: string,
  renderMath: (math: string, displayMode: boolean) => Node
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  // Split par **bold** et par LaTeX
  const parts = text.split(
    new RegExp(String.raw`(\*\*[^*]+\*\*|${MATH_SEGMENT_SOURCE})`, "g"),
  );

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      const strong = document.createElement("strong");
      strong.className = "font-semibold";
      strong.textContent = part.slice(2, -2);
      fragment.appendChild(strong);
    } else if (
      part.startsWith("$$") &&
      part.endsWith("$$")
    ) {
      const candidate = part.slice(2, -2).trim();
      fragment.appendChild(
        isLikelyMath(candidate)
          ? renderMath(candidate, true)
          : document.createTextNode(escapeKatexText(part))
      );
    } else if (
      part.startsWith("$") &&
      part.endsWith("$") &&
      part.length > 2
    ) {
      const candidate = part.slice(1, -1).trim();
      fragment.appendChild(
        isLikelyMath(candidate)
          ? renderMath(candidate, false)
          : document.createTextNode(escapeKatexText(part))
      );
    } else {
      // Texte brut : les indices écrits sans `$` (Q_1) sont rendus en formule
      for (const piece of splitBareMath(part)) {
        fragment.appendChild(
          "math" in piece
            ? renderMath(piece.math, false)
            : document.createTextNode(escapeKatexText(piece.text)),
        );
      }
    }
  }

  return fragment;
}

/**
 * Crée un élément <table> HTML à partir des lignes détectées.
 */
function createTableElement(rows: string[][]): HTMLTableElement {
  const table = document.createElement("table");
  table.className =
    "w-full text-sm border-collapse my-3 rounded-lg overflow-hidden";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.className = "bg-indigo-100";

  for (const cell of rows[0]) {
    const th = document.createElement("th");
    th.className =
      "px-3 py-2 text-left font-semibold text-indigo-800 border border-indigo-200";
    th.textContent = cell;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (let r = 1; r < rows.length; r++) {
    const tr = document.createElement("tr");
    tr.className = r % 2 === 0 ? "bg-white" : "bg-gray-50";

    for (const cell of rows[r]) {
      const td = document.createElement("td");
      td.className = "px-3 py-2 text-gray-700 border border-gray-200";
      td.textContent = cell;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  return table;
}

/**
 * Les choix de QCM arrivent souvent en LaTeX brut, sans délimiteurs (`IQR = \frac{a}{b}`).
 * Si le texte n'a aucun `$` mais contient une commande LaTeX (ou un indice/exposant
 * avec un `=`), il est enveloppé dans `$...$` pour être rendu comme formule.
 */
export function ensureMathDelimiters(text: string): string {
  if (text.includes("$")) return text;
  const isMath = /\\[a-zA-Z]+/.test(text) || (/[_^]/.test(text) && text.includes("="));
  return isMath ? `$${text.trim()}$` : text;
}

/**
 * Rendu inline de texte contenant du LaTeX ($...$ et $$...$$),
 * du markdown gras (**text**) et des tableaux (| colonnes |).
 */
export function LatexText({
  text: rawText,
  className = "",
  autoMath = false,
}: {
  text: string;
  className?: string;
  /** Traite un texte sans `$` comme une formule s'il en a l'allure (choix de QCM). */
  autoMath?: boolean;
}) {
  const repaired = repairLatexEscapes(rawText);
  const text = autoMath ? ensureMathDelimiters(repaired) : repaired;
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = "";

    // Fonction de rendu math réutilisable
    const renderMath = (math: string, displayMode: boolean): Node => {
      const span = document.createElement("span");
      try {
        katex.render(math, span, {
          displayMode,
          throwOnError: false,
          strict: false,
        });
      } catch {
        span.textContent = math;
      }
      return span;
    };

    // Détection de tableau
    const tableRows = detectTable(text);
    if (tableRows) {
      ref.current.appendChild(createTableElement(tableRows));
      return;
    }

    // Sinon : rendu LaTeX + markdown bold
    ref.current.appendChild(parseBoldMarkdown(text, renderMath));
  }, [text]);

  return <span ref={ref} className={className} />;
}
