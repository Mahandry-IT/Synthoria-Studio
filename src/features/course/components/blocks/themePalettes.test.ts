import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/shared/utils/contrast";
import { THEME_TOKENS } from "@/test-utils/cssTokens";
import type { Theme } from "@/shared/utils/theme";
import { CHART_COLORS } from "./chartColors";
import { MERMAID_THEME_VARS, buildMermaidConfig } from "./mermaidConfig";
import { WIDGET_THEME_VARS } from "./widgetDocument";

const THEMES: Theme[] = ["light", "dark"];

describe.each(THEMES)("widgets, thème %s", (theme) => {
  const t = THEME_TOKENS[theme];
  const v = WIDGET_THEME_VARS[theme];

  it("variables --w-* = tokens de globals.css", () => {
    expect(v).toEqual({
      "--w-bg": t.surface,
      "--w-fg": t.ink,
      "--w-muted": t["ink-3"],
      "--w-accent": t.primary,
      "--w-border": t.line,
      "--w-surface": t.sunken,
    });
  });

  it.each([
    ["--w-fg", "--w-bg"],
    ["--w-fg", "--w-surface"],
    ["--w-muted", "--w-bg"],
    ["--w-muted", "--w-surface"],
    ["--w-accent", "--w-bg"],
    ["--w-accent", "--w-surface"],
    ["--w-bg", "--w-accent"], // libellé d'un nœud actif de la boîte à outils
  ])("%s sur %s ≥ 4,5:1", (fg, bg) => {
    expect(contrastRatio(v[fg], v[bg]), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
});

/** Variable Mermaid → token de globals.css dont elle est la copie. */
const MERMAID_TOKEN: Record<string, string> = {
  primaryColor: "primary-soft",
  primaryBorderColor: "primary",
  primaryTextColor: "ink",
  secondaryColor: "sunken",
  secondaryBorderColor: "line-strong",
  secondaryTextColor: "ink",
  tertiaryColor: "surface",
  tertiaryBorderColor: "line",
  tertiaryTextColor: "ink",
  lineColor: "ink-3",
  textColor: "ink",
  mainBkg: "primary-soft",
  nodeBorder: "primary",
  nodeTextColor: "ink",
  clusterBkg: "sunken",
  clusterBorder: "line-2",
  edgeLabelBackground: "surface",
  background: "surface",
  noteBkgColor: "warn-soft",
  noteBorderColor: "warn",
  noteTextColor: "ink",
  actorBkg: "primary-soft",
  actorBorder: "primary",
  actorTextColor: "ink",
  signalColor: "ink-3",
  signalTextColor: "ink",
};

describe.each(THEMES)("Mermaid, thème %s", (theme) => {
  const t = THEME_TOKENS[theme];
  const v: Record<string, string> = MERMAID_THEME_VARS[theme];

  it("couvre toutes les variables attendues, en hex", () => {
    expect(Object.keys(v).sort()).toEqual(Object.keys(MERMAID_TOKEN).sort());
    for (const value of Object.values(v)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("variables = tokens de globals.css", () => {
    for (const [name, token] of Object.entries(MERMAID_TOKEN)) {
      expect(v[name], `${name} ↔ ${token}`).toBe(t[token]);
    }
  });

  it.each([
    ["primaryTextColor", "primaryColor"],
    ["secondaryTextColor", "secondaryColor"],
    ["tertiaryTextColor", "tertiaryColor"],
    ["textColor", "background"],
    ["textColor", "edgeLabelBackground"],
    ["textColor", "clusterBkg"],
    ["nodeTextColor", "mainBkg"],
    ["noteTextColor", "noteBkgColor"],
    ["actorTextColor", "actorBkg"],
    ["signalTextColor", "background"],
  ])("texte %s sur %s ≥ 4,5:1", (fg, bg) => {
    expect(contrastRatio(v[fg], v[bg]), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["lineColor", "signalColor", "nodeBorder", "actorBorder", "noteBorderColor", "primaryBorderColor"])(
    "trait %s sur le fond ≥ 3:1",
    (name) => {
      expect(contrastRatio(v[name], v.background), name).toBeGreaterThanOrEqual(3);
    },
  );
});

describe("buildMermaidConfig", () => {
  it.each(THEMES)("conserve les garde-fous de sécurité, thème %s", (theme) => {
    const config = buildMermaidConfig(theme);
    expect(config.securityLevel).toBe("strict");
    expect(config.flowchart.htmlLabels).toBe(false);
    expect(config.startOnLoad).toBe(false);
    expect(config.theme).toBe("base");
  });

  it("applique la palette du thème et le mode sombre", () => {
    const light = buildMermaidConfig("light");
    const dark = buildMermaidConfig("dark");
    expect(light.themeVariables.darkMode).toBe(false);
    expect(dark.themeVariables.darkMode).toBe(true);
    expect(light.themeVariables.background).toBe(THEME_TOKENS.light.surface);
    expect(dark.themeVariables.background).toBe(THEME_TOKENS.dark.surface);
    expect(dark.themeVariables.primaryBorderColor).toBe(THEME_TOKENS.dark.primary);
  });

  it("utilise la police Inter de l'application avec repli système", () => {
    expect(buildMermaidConfig("light").fontFamily).toContain("var(--font-inter)");
    expect(buildMermaidConfig("light").fontFamily).toContain("system-ui");
  });
});

describe.each(THEMES)("graphique, thème %s", (theme) => {
  const t = THEME_TOKENS[theme];
  const c = CHART_COLORS[theme];

  it("axes, libellés, contour et séparation = tokens de globals.css", () => {
    expect(c.axis).toBe(t["ink-3"]);
    expect(c.tick).toBe(t["ink-3"]);
    expect(c.label).toBe(t["ink-2"]);
    expect(c.outline).toBe(t.ink);
    expect(c.sliceStroke).toBe(t.surface);
    expect(c.series[0]).toBe(t.primary);
    expect(c.series[1]).toBe(t.accent);
  });

  it("quatre séries distinctes, ≥ 3:1 sur la surface", () => {
    expect(new Set(c.series).size).toBe(4);
    for (const color of c.series) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
      expect(contrastRatio(color, t.surface), color).toBeGreaterThanOrEqual(3);
    }
  });

  it("textes ≥ 4,5:1 et traits ≥ 3:1 sur la surface", () => {
    expect(contrastRatio(c.tick, t.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.label, t.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.axis, t.surface)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(c.outline, t.surface)).toBeGreaterThanOrEqual(3);
  });
});
