import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/shared/utils/contrast";
import { BADGE_TONE_CLASSES } from "./Badge";
import { BUTTON_VARIANT_CLASSES } from "./Button";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`);
  const block = css.slice(start, css.indexOf("\n}", start));
  return Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6});/g)].map((m) => [m[1], m[2]]));
}

const themes = { clair: tokens(":root"), sombre: tokens('[data-theme="dark"]') };

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
];

describe.each(Object.entries(themes))("contrastes des écrans Révisions et Tuteur, thème %s", (_n, t) => {
  it.each(screenPairs)("%s sur %s ≥ 4,5:1", (fg, bg) => {
    expect(contrastRatio(t[fg], t[bg]), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
});
