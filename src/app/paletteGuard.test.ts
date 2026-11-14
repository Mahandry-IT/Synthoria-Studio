import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Garde-fou « carnet éditorial » : aucune classe de palette Tailwind ni couleur brute (`bg-white`…)
 * dans le code de l'application ; les couleurs viennent des tokens de `globals.css`.
 * Les seules couleurs littérales hors CSS sont les palettes Mermaid, graphique et widget (hex, README).
 */
const SRC = fileURLToPath(new URL("..", import.meta.url));

const PALETTES =
  "gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTILITIES = "bg|text|border|ring|outline|fill|stroke|from|to|via|divide|decoration|accent|caret|shadow|placeholder";

/** `bg-indigo-600`, `hover:text-gray-500`, `border-red-200/50`… */
const PALETTE_CLASS = new RegExp(String.raw`(?<![\w-])(?:${UTILITIES})-(?:${PALETTES})-\d{2,3}(?![\w-])`, "g");
/** Valeurs arbitraires en hex (`text-[#6366f1]`) et couleurs hex en style inline (`color: "#fff"`). */
const HEX_CLASS = new RegExp(String.raw`(?<![\w-])(?:${UTILITIES})-\[#[0-9a-fA-F]{3,8}\]`, "g");
const HEX_INLINE = /\b(?:color|background(?:Color)?|fill|stroke|borderColor)\s*:\s*["']#[0-9a-fA-F]{3,8}["']/g;
/** `bg-white`, `text-black`, `bg-black/20`, `ring-white`… (hors `bg-bg`, `text-bg`, tokens). */
const RAW_CLASS = new RegExp(String.raw`(?<![\w-])(?:${UTILITIES})-(?:white|black)(?![\w-])`, "g");

/**
 * Exceptions documentées : la vignette d'une vidéo se superpose à une image (voile et durée), où le
 * contraste ne dépend pas du thème. Seules ces classes y sont admises.
 */
const EXCEPTIONS: Record<string, Readonly<Record<string, number>>> = {
  // Occurrences admises (fond de vignette, voile, icône de lecture, pastille de durée) : une de plus échoue.
  "features/course/components/VideoCard.tsx": { "bg-black": 4, "text-white": 2 },
};

/** Palettes littérales (hex) documentées dans le README : seules à pouvoir porter des couleurs brutes. */
const HEX_FILES = new Set([
  "features/course/components/blocks/mermaidConfig.ts",
]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

/** Classes interdites d'un texte source (les classes autorisées pour ce fichier sont écartées). */
function forbiddenClasses(source: string, allowed: Readonly<Record<string, number>> = {}, allowHex = false): string[] {
  const patterns = [PALETTE_CLASS, RAW_CLASS, ...(allowHex ? [] : [HEX_CLASS, HEX_INLINE])];
  const found = patterns.flatMap((re) => [...source.matchAll(re)].map((m) => m[0]));
  const budget = { ...allowed };
  return found.filter((c) => {
    if ((budget[c] ?? 0) > 0) {
      budget[c] -= 1;
      return false;
    }
    return true;
  });
}

describe("garde-fou des classes de palette", () => {
  it("détecte les classes interdites (le test peut échouer)", () => {
    expect(forbiddenClasses('className="bg-indigo-600 hover:bg-indigo-700 text-gray-500"')).toEqual([
      "bg-indigo-600",
      "bg-indigo-700",
      "text-gray-500",
    ]);
    expect(forbiddenClasses('"bg-white" "divide-slate-200" "text-red-600/80" "bg-black/20"')).toEqual([
      "divide-slate-200",
      "text-red-600",
      "bg-white",
      "bg-black",
    ]);
  });

  it("ne confond pas les tokens ni les utilitaires voisins", () => {
    expect(forbiddenClasses("bg-bg text-ink border-line-strong -translate-x-1 bg-surface ring-offset-2")).toEqual([]);
    expect(forbiddenClasses("hover:-translate-y-px motion-reduce:hover:translate-y-0 text-primary-ink")).toEqual([]);
  });

  it("n'admet l'exception de VideoCard que dans la limite d'occurrences", () => {
    const allowed = EXCEPTIONS["features/course/components/VideoCard.tsx"];
    expect(forbiddenClasses('"bg-black/75 text-white bg-white"', allowed)).toEqual(["bg-white"]);
    expect(forbiddenClasses('"text-white text-white text-white"', allowed)).toEqual(["text-white"]);
  });

  it("détecte les hex arbitraires et inline, sauf dans les palettes littérales", () => {
    const src = 'className="text-[#6366f1] bg-[#fff]" style={{ color: "#fff" }}';
    expect(forbiddenClasses(src)).toHaveLength(3);
    expect(forbiddenClasses(src, {}, true)).toEqual([]);
  });

  it("aucun fichier de src/ (hors tests) n'utilise de classe de palette", () => {
    const files = sourceFiles(SRC);
    expect(files.length).toBeGreaterThan(100);
    const offenders: Record<string, string[]> = {};
    for (const file of files) {
      const name = relative(SRC, file).split(sep).join("/");
      const found = forbiddenClasses(readFileSync(file, "utf8"), EXCEPTIONS[name], HEX_FILES.has(name));
      if (found.length > 0) offenders[name] = [...new Set(found)];
    }
    expect(offenders).toEqual({});
  });
});
