import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/shared/utils/contrast";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`);
  const block = css.slice(start, css.indexOf("\n}", start));
  return Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6});/g)].map((m) => [m[1], m[2]]));
}

const themes = { clair: tokens(":root"), sombre: tokens('[data-theme="dark"]') };

/** [premier plan, arrière-plan, ratio minimal] */
const TEXT_PAIRS: [string, string, number][] = [
  ["ink", "bg", 4.5], ["ink", "surface", 4.5],
  ["ink-2", "bg", 4.5], ["ink-2", "surface", 4.5],
  ["ink-3", "bg", 4.5], ["ink-3", "surface", 4.5], ["ink-3", "sunken", 4.5],
  ["accent", "bg", 4.5], ["accent", "surface", 4.5],
  ["primary-ink", "primary", 4.5], ["accent-ink", "accent", 4.5],
  ["ink", "primary-soft", 4.5],
  ["ok", "ok-soft", 4.5], ["warn", "warn-soft", 4.5], ["err", "err-soft", 4.5],
];
const UI_PAIRS: [string, string, number][] = [
  ["line-strong", "bg", 3], ["line-strong", "surface", 3], ["line-strong", "sunken", 3],
  ["accent", "bg", 3], ["primary", "surface", 3],
];

describe.each(Object.entries(themes))("contrastes du thème %s", (_name, t) => {
  it("expose les mêmes tokens que le thème clair", () => {
    expect(Object.keys(t).sort()).toEqual(Object.keys(themes.clair).sort());
  });
  it.each(TEXT_PAIRS)("texte %s sur %s ≥ %f:1", (fg, bg, min) => {
    expect(contrastRatio(t[fg], t[bg])).toBeGreaterThanOrEqual(min);
  });
  it.each(UI_PAIRS)("composant %s sur %s ≥ %f:1", (fg, bg, min) => {
    expect(contrastRatio(t[fg], t[bg])).toBeGreaterThanOrEqual(min);
  });
});

describe("coloration syntaxique sombre", () => {
  const sunken = themes.sombre.sunken;
  const colors = [...css.matchAll(/\[data-theme="dark"\] \.code-highlight[^{]*\{\s*(?:[^}]*?)color: (#[0-9a-f]{6});/g)].map((m) => m[1]);
  it("trouve les jetons", () => expect(colors.length).toBeGreaterThan(10));
  it.each([...new Set(colors)])("%s ≥ 4,5:1 sur sunken", (c) => {
    expect(contrastRatio(c, sunken)).toBeGreaterThanOrEqual(4.5);
  });
});
