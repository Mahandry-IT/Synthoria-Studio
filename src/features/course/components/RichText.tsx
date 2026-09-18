"use client";

import { LatexText } from "@/shared/utils/latex";
import { sanitizeExtractedText } from "@/shared/utils/textSanitize";

// ─── Parsers ──────────────────────────────────────────────

// Caractères Private Use Area : jamais présents dans le texte backend.
const MASK_OPEN = "";
const MASK_CLOSE = "";
const MASK_PATTERN = new RegExp(`${MASK_OPEN}(\\d+)${MASK_CLOSE}`, "g");

/**
 * Remplace chaque segment `$$...$$` / `$...$` par un jeton opaque.
 * @returns le texte masqué et `restore`, qui réinjecte les formules d'origine.
 */
function maskMath(text: string): { masked: string; restore: (s: string) => string } {
  const segments: string[] = [];
  const masked = text.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, (segment) => {
    segments.push(segment);
    return `${MASK_OPEN}${segments.length - 1}${MASK_CLOSE}`;
  });
  const restore = (s: string) => s.replace(MASK_PATTERN, (_m, i: string) => segments[Number(i)] ?? "");
  return { masked, restore };
}

/**
 * Détecte un tableau aplati backend : "H1 | H2 — r1 | r2; r1b | r2b"
 * Séparateur `—` entre headers et rows, `;` entre lignes.
 */
function parseFlattenedTable(text: string): { headers: string[]; rows: string[][] } | null {
  const trimmed = text.trim();
  // Le délimiteur est un unique tiret long `—` (U+2014)
  const dashIdx = trimmed.indexOf("—");
  if (dashIdx <= 0 || dashIdx >= trimmed.length - 1) return null;

  const headerPart = trimmed.slice(0, dashIdx).trim();
  const rowPart = trimmed.slice(dashIdx + 1).trim();

  if (!headerPart || !rowPart) return null;

  const headers = headerPart.split("|").map((h) => h.trim()).filter(Boolean);
  if (headers.length < 2) return null;

  const rowStrs = rowPart.split(";").map((r) => r.trim()).filter(Boolean);
  if (rowStrs.length === 0) return null;

  const rows: string[][] = rowStrs.map((row) =>
    row.split("|").map((cell) => cell.trim())
  );

  // Toutes les lignes doivent avoir au moins le même nombre de colonnes
  const colCount = headers.length;
  const validRows = rows.filter((r) => r.length >= 1 && r.length <= colCount + 1);
  if (validRows.length === 0) return null;

  return { headers, rows: validRows };
}

/**
 * Détecte une liste aplatie backend : items séparés par " ; " (≥ 2 items).
 * On ne considère pas une liste si le séparateur apparaît une seule fois
 * (pourrait être de la prose normale).
 */
function parseFlattenedList(text: string): string[] | null {
  const trimmed = text.trim();
  const parts = trimmed.split(/\s*;\s+/);
  // Au moins 2 items, chacun non vide
  if (parts.length < 2) return null;
  const filtered = parts.filter((p) => p.length > 0);
  if (filtered.length < 2) return null;
  return filtered;
}

// ─── Sub-components ──────────────────────────────────────

function RichTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-3 rounded-lg border border-gray-200">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-indigo-100">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold text-indigo-800 border border-indigo-200"
              >
                <RichText text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {headers.map((_, cIdx) => (
                <td
                  key={cIdx}
                  className="px-3 py-2 text-gray-700 border border-gray-200"
                >
                  <RichText text={row[cIdx] ?? ""} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RichList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1 my-2">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-gray-700">
          <RichText text={item} />
        </li>
      ))}
    </ul>
  );
}

// ─── Main component ──────────────────────────────────────

interface RichTextProps {
  text: string;
  className?: string;
}

/**
 * Rendu riche de texte backend : tables aplatiees, listes aplaties, LaTeX.
 * Applique `sanitizeExtractedText` avant parsing, puis déroute vers
 * `LatexText` pour tout segment non reconnu.
 *
 * Aucun `dangerouslySetInnerHTML` — construction JSX directe.
 *
 * @see plan-sync-frontend-backend.md — étape 5
 */
export function RichText({ text, className = "" }: RichTextProps) {
  if (!text || text.trim().length === 0) return null;

  // Les formules sont masquées pour que ni la sanitisation (`x^e` → `xê`) ni la
  // détection de table/liste (`|x|`, `\;`, `—`) ne les altèrent.
  const { masked, restore } = maskMath(text);
  const sanitized = sanitizeExtractedText(masked);

  // 1. Table aplatie ?
  const table = parseFlattenedTable(sanitized);
  if (table) {
    return (
      <span className={className}>
        <RichTable
          headers={table.headers.map(restore)}
          rows={table.rows.map((row) => row.map(restore))}
        />
      </span>
    );
  }

  // 2. Liste aplatie ?
  const list = parseFlattenedList(sanitized);
  if (list) {
    return (
      <span className={className}>
        <RichList items={list.map(restore)} />
      </span>
    );
  }

  // 3. Fallback : rendu LaTeX via LatexText
  return <LatexText text={restore(sanitized)} className={className} />;
}
