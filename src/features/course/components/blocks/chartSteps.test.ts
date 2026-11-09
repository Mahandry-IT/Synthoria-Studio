import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { courseSectionSchema } from "../../course.schema";
import type { CourseChart, CourseChartStep } from "../../course.types";
import { ChartBlock } from "./ChartBlock";
import { isHighlighted } from "./chartHighlight";

const base: CourseChart = {
  kind: "bar",
  caption: "Ventes",
  labels: ["a", "b", "c"],
  series: [{ name: "s1", values: [1, 2, 3] }, { name: "s2", values: [3, 2, 1] }],
};
const render = (chart: CourseChart) => renderToStaticMarkup(createElement(ChartBlock, { chart }));
const step = (labels: number[], series: number[]): CourseChartStep => ({ caption: "Légende 1", highlight_labels: labels, highlight_series: series });

describe("isHighlighted", () => {
  it("tout est normal sans étape ou sans mise en avant", () => {
    expect(isHighlighted(undefined, 0, 0)).toBe(true);
    expect(isHighlighted(step([], []), 2, 1)).toBe(true);
  });
  it("met en avant par label OU par série", () => {
    const s = step([1], [0]);
    expect(isHighlighted(s, 1, 1)).toBe(true);
    expect(isHighlighted(s, 0, 0)).toBe(true);
    expect(isHighlighted(s, 2, 1)).toBe(false);
  });
  it("secteur : seul le label compte", () => {
    expect(isHighlighted(step([0], []), 0, -1)).toBe(true);
    expect(isHighlighted(step([0], []), 1, -1)).toBe(false);
  });
});

describe("ChartBlock", () => {
  it("sans steps : pas de contrôles ni d'atténuation", () => {
    const out = render(base);
    expect(out).not.toContain("Suivant");
    expect(out).not.toContain("opacity");
  });
  it("avec steps : boutons, légende et éléments atténués", () => {
    const out = render({ ...base, steps: [step([], [0])] });
    expect(out).toContain("Suivant");
    expect(out).toContain("Précédent");
    expect(out).toContain("Étape 1/1");
    expect(out).toContain("Légende 1");
    expect(out).toContain('aria-live="polite"');
    expect(out.match(/opacity="0\.25"/g)).toHaveLength(3); // 3 barres de s2
    expect(out).toContain('stroke="#111827"');
  });
  it("étape sans mise en avant : rien d'atténué", () => {
    expect(render({ ...base, steps: [step([], [])] })).not.toContain('opacity="0.25"');
  });
  it("camembert : highlight_labels = secteurs", () => {
    const out = render({ kind: "pie", labels: ["x", "y"], series: [{ name: "s", values: [1, 1] }], steps: [step([0], [])] });
    expect(out.match(/opacity="0\.25"/g)).toHaveLength(1);
  });
});

describe("schéma des étapes", () => {
  const parse = (steps: unknown) =>
    courseSectionSchema.parse({
      title: "S",
      subsections: [{ title: "Q", blocks: [{ type: "chart", chart: { ...base, steps } }] }],
    }).subsections?.[0].blocks[0].chart;
  it("accepte des steps valides", () => {
    expect(parse([{ caption: "ok", highlight_labels: [0], highlight_series: [] }])?.steps).toHaveLength(1);
  });
  it("tolère les steps invalides ou absents", () => {
    expect(parse("nope")?.steps).toEqual([]);
    expect(parse([{ caption: 3 }, { caption: "ok", highlight_labels: ["x"] }, null])?.steps).toEqual([]);
    expect(parse(undefined)?.steps).toEqual([]);
    expect(parse([{ caption: "ok" }, { nope: 1 }])?.steps).toHaveLength(1);
  });
});
