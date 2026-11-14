import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/shared/utils/contrast";
import { THEME_TOKENS } from "@/test-utils/cssTokens";
import { BADGE_TONE_CLASSES } from "./Badge";
import { BUTTON_VARIANT_CLASSES } from "./Button";

const themes = { clair: THEME_TOKENS.light, sombre: THEME_TOKENS.dark };

/** Paires [texte, fond] déduites des classes réelles (`text-X`, `bg-X`, `hover:bg-X`) ; fond absent → bg et surface. */
function pairs(classes: string): [string, string][] {
  const text = /(?:^|\s)text-([a-z0-9-]+)/.exec(classes)?.[1];
  const bgs = [...classes.matchAll(/(?:^|\s)(?:hover:)?bg-([a-z0-9-]+)/g)].map((m) => m[1]).filter((b) => b !== "transparent");
  const hasPlainBg = /(?:^|\s)bg-(?!transparent)/.test(classes);
  const all = hasPlainBg ? bgs : [...bgs, "bg", "surface"];
  return all.map((b) => [text!, b]);
}

const cases: [string, [string, string][]][] = [
  ...Object.entries(BUTTON_VARIANT_CLASSES).map(([k, v]) => [`Button ${k}`, pairs(v)] as [string, [string, string][]]),
  ...Object.entries(BADGE_TONE_CLASSES).map(([k, v]) => [`Badge ${k}`, pairs(v)] as [string, [string, string][]]),
];

describe.each(Object.entries(themes))("contrastes des composants, thème %s", (_n, t) => {
  it.each(cases)("%s ≥ 4,5:1", (_name, list) => {
    expect(list.length).toBeGreaterThan(0);
    for (const [fg, bg] of list) {
      expect(contrastRatio(t[fg], t[bg]), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("texte d'erreur et de champ en erreur lisibles sur la surface", () => {
    expect(contrastRatio(t.err, t.surface)).toBeGreaterThanOrEqual(4.5);
  });
});

/** Paires utilisées par les écrans Révisions et Tuteur (options corrigées, bulles, correction, encart de quota). */
const screenPairs: [string, string][] = [
  ["ok", "ok-soft"],
  ["err", "err-soft"],
  ["warn", "warn-soft"],
  ["ink", "ok-soft"],
  ["ink", "err-soft"],
  ["ink", "warn-soft"],
  ["ink", "primary-soft"],
  ["ink-2", "primary-soft"],
  ["primary-ink", "primary"],
  ["ink-2", "sunken"],
  ["ink-3", "surface"],
  // Lecteur de cours : fil des chapitres (texte sur le fond de page), repères, encadrés et question posée.
  ["ink", "bg"],
  ["ink-2", "bg"],
  ["ink-3", "bg"],
  ["ink-3", "sunken"],
  ["ok", "surface"],
];

describe.each(Object.entries(themes))("contrastes des écrans Révisions et Tuteur, thème %s", (_n, t) => {
  it.each(screenPairs)("%s sur %s ≥ 4,5:1", (fg, bg) => {
    expect(contrastRatio(t[fg], t[bg]), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
});

/** Détail du cours et blocs de contenu : encadrés, tableaux, légendes, messages (texte ≥ 4,5:1). */
const blockPairs: [string, string][] = [
  ["ink", "surface"],
  ["ink-2", "surface"],
  ["ink", "sunken"],
  ["ink-3", "bg"],
  ["primary", "surface"],
  ["primary", "primary-soft"],
  ["warn", "surface"],
  ["warn", "warn-soft"],
  ["ok", "ok-soft"],
  ["err", "err-soft"],
  ["ink", "primary-soft"],
  ["ink", "warn-soft"],
  ["ink", "ok-soft"],
  ["ink", "err-soft"],
];

/** Quiz et exercices : retours corrigés (texte secondaire, numéros de question, indices) sur les fonds `*-soft`. */
const quizExercisePairs: [string, string][] = [
  ["ink-2", "ok-soft"],
  ["ink-2", "err-soft"],
  ["ink-2", "warn-soft"],
  ["primary", "ok-soft"],
  ["primary", "err-soft"],
  ["err", "surface"],
  ["ok", "surface"],
  ["ink-2", "surface"],
  ["ink-3", "surface"],
  ["ok", "ok-soft"],
  ["err", "err-soft"],
  ["warn", "warn-soft"],
];

describe.each(Object.entries(themes))("contrastes du quiz et des exercices, thème %s", (_n, t) => {
  it.each(quizExercisePairs)("%s sur %s ≥ 4,5:1", (fg, bg) => {
    expect(contrastRatio(t[fg], t[bg]), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each(Object.entries(themes))("contrastes du détail du cours et des blocs, thème %s", (_n, t) => {
  it.each(blockPairs)("%s sur %s ≥ 4,5:1", (fg, bg) => {
    expect(contrastRatio(t[fg], t[bg]), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
});

/** Éléments graphiques non textuels (filet d'onglet actif, bordures d'encadré) : 3:1 minimum (WCAG 1.4.11). */
const nonTextPairs: [string, string][] = [
  ["accent", "bg"],
  ["accent", "surface"],
  ["primary", "primary-soft"],
  ["warn", "warn-soft"],
  ["ok", "ok-soft"],
  ["err", "err-soft"],
  ["line-strong", "surface"],
  // Filet des indices et de la démarche attendue (exercices), anneau du minuteur (quiz).
  ["accent", "primary-soft"],
  ["err", "surface"],
  ["ok", "surface"],
];

describe.each(Object.entries(themes))("contrastes non textuels du détail du cours, thème %s", (_n, t) => {
  it.each(nonTextPairs)("%s sur %s ≥ 3:1", (fg, bg) => {
    expect(contrastRatio(t[fg], t[bg]), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(3);
  });
});

/**
 * Podcast et apprentissage (défi, rappel, exemple guidé, vérification, pièges, résumé, sources) :
 * titres de verdict et textes courants sur leurs fonds `*-soft`, `sunken` et `surface`.
 */
const podcastLearningPairs: [string, string][] = [
  ["ok", "ok-soft"],
  ["err", "err-soft"],
  ["warn", "warn-soft"],
  ["ink", "ok-soft"],
  ["ink", "err-soft"],
  ["ink", "warn-soft"],
  ["ink-2", "warn-soft"],
  ["ok", "warn-soft"],
  ["primary", "primary-soft"],
  ["ink", "primary-soft"],
  ["ink-2", "primary-soft"],
  ["err", "primary-soft"],
  ["ok", "sunken"],
  ["primary", "sunken"],
  ["ink", "sunken"],
  ["ink-2", "sunken"],
  ["ink-3", "sunken"],
  ["ink-2", "surface"],
  ["ink-3", "surface"],
  ["primary", "surface"],
  ["err", "surface"],
];

describe.each(Object.entries(themes))("contrastes du podcast et de l'apprentissage, thème %s", (_n, t) => {
  it.each(podcastLearningPairs)("%s sur %s ≥ 4,5:1", (fg, bg) => {
    expect(contrastRatio(t[fg], t[bg]), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  // Anneau de progression et icônes du podcast (accent / err), filets d'encadré (3:1, WCAG 1.4.11).
  it.each([
    ["accent", "surface"],
    ["accent", "primary-soft"],
    ["err", "surface"],
    ["ok", "surface"],
    ["warn", "warn-soft"],
  ])("élément graphique %s sur %s ≥ 3:1", (fg, bg) => {
    expect(contrastRatio(t[fg], t[bg]), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(3);
  });
});

/**
 * Balayage final : texte sur `sunken` et `mark` (surligneur), éléments de formulaire
 * (bordures de champs et de cases, anneau de focus) sur chaque fond où ils apparaissent.
 */
const sweepTextPairs: [string, string][] = [
  ["ink", "mark"],
  ["ink", "sunken"],
  ["ink-2", "sunken"],
  ["ink-3", "sunken"],
  ["err", "sunken"],
  ["warn", "sunken"],
  ["ok", "sunken"],
  ["primary", "sunken"],
  ["ink", "primary-soft"],
  ["ink-2", "primary-soft"],
  ["primary", "primary-soft"],
  ["accent-ink", "accent"],
  ["primary-ink", "primary"],
  ["primary-ink", "err"],
];

const sweepUiPairs: [string, string][] = [
  // Bordures de champs, de cases et d'options : 3:1 (WCAG 1.4.11) sur tous les fonds de formulaire.
  ["line-strong", "bg"],
  ["line-strong", "surface"],
  ["line-strong", "sunken"],
  // Champ en erreur et anneau de focus (accent).
  ["err", "bg"],
  ["err", "surface"],
  ["accent", "bg"],
  ["accent", "surface"],
  ["accent", "sunken"],
  ["accent", "primary-soft"],
];

describe.each(Object.entries(themes))("contrastes du balayage final, thème %s", (_n, t) => {
  it.each(sweepTextPairs)("texte %s sur %s ≥ 4,5:1", (fg, bg) => {
    expect(contrastRatio(t[fg], t[bg]), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(sweepUiPairs)("élément graphique %s sur %s ≥ 3:1", (fg, bg) => {
    expect(contrastRatio(t[fg], t[bg]), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(3);
  });
});

/** `top` posé à `alpha` sur `base` (équivalent d'un `bg-ink/20` sur la couleur du toast). */
function over(top: string, base: string, alpha: number): string {
  const channel = (i: number) => Math.round(parseInt(top.slice(i, i + 2), 16) * alpha + parseInt(base.slice(i, i + 2), 16) * (1 - alpha));
  return `#${[1, 3, 5].map((i) => channel(i).toString(16).padStart(2, "0")).join("")}`;
}

/** Toasts colorés (`ErrorToast`) : texte `bg` sur la couleur du toast, et sur les boutons / panneaux `bg-ink/20|30`. */
describe.each(Object.entries(themes))("contrastes des toasts, thème %s", (_n, t) => {
  it.each(["ok", "err", "warn", "primary"])("texte sur le toast %s, son bouton et son panneau ≥ 4,5:1", (tone) => {
    expect(contrastRatio(t.bg, t[tone]), "toast").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t.bg, over(t.ink, t[tone], 0.2)), "panneau et bouton").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t.bg, over(t.ink, t[tone], 0.3)), "bouton au survol").toBeGreaterThanOrEqual(4.5);
  });
});

/**
 * Coloration syntaxique claire (classes `hljs-*` de globals.css) sur le fond de la boîte de code
 * (`sunken`) ; le thème sombre est couvert par designTokens.test.ts.
 */
describe("coloration syntaxique claire", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const light = css.slice(css.indexOf("Coloration syntaxique"), css.indexOf("Saisies riches"));
  const colors = [...new Set([...light.matchAll(/color: (#[0-9a-f]{6});/g)].map((m) => m[1]))];

  it("trouve les jetons", () => expect(colors.length).toBeGreaterThan(10));
  it.each(colors)("%s ≥ 4,5:1 sur sunken", (color) => {
    expect(contrastRatio(color, THEME_TOKENS.light.sunken)).toBeGreaterThanOrEqual(4.5);
  });
});
