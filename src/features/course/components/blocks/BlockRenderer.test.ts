import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CourseContentBlock } from "../../course.types";
import { BlockRenderer } from "./BlockRenderer";
import { axisMax, pieSlices } from "./chartGeometry";

const html = (blocks: CourseContentBlock[]) => renderToStaticMarkup(createElement(BlockRenderer, { blocks }));

describe("BlockRenderer", () => {
  it("rend chaque type statique de bloc", () => {
    const out = html([
      { type: "text", text: "Un texte." },
      { type: "definition", text: "Une définition." },
      { type: "callout", text: "Prudence", callout_variant: "warning" },
      { type: "list", list_items: ["un", "deux"], list_ordered: true },
      { type: "table", table: { caption: "Cap", headers: ["H"], rows: [["cellule"]] } },
      { type: "pitfall", pitfall: { description: "Piège", why_it_happens: "car", how_to_avoid: "faire" } },
      { type: "worked_example", worked_example: { statement: "Énoncé", steps: ["e1", "e2"], result: "r" } },
    ]);

    // Le texte riche (LaTeX/markdown) est peuplé côté client : on vérifie la structure rendue.
    expect(out).toContain("border-indigo-500"); // définition
    expect(out).toContain("Attention"); // callout warning
    expect(out).toContain("list-decimal"); // liste ordonnée
    expect(out).toContain("<table");
    expect(out).toContain("Comment l&#x27;éviter"); // fiche piège
    expect(out).toContain("Étape suivante");
    expect(out.match(/<li>/g)).toHaveLength(3); // 2 items de liste + 1 seule étape révélée
  });

  it("rend un graphique en SVG sans HTML injecté", () => {
    const out = html([
      { type: "chart", chart: { kind: "bar", caption: "Ventes", labels: ["a", "<b>"], series: [{ name: "n", values: [1, 2] }] } },
    ]);

    expect(out).toContain("<svg");
    expect(out).toContain("<rect");
    expect(out).toContain("&lt;b&gt;"); // échappé par React
    expect(out).not.toContain("<b>");
  });

  it("rend un secteur, une courbe et un schéma (conteneur)", () => {
    expect(html([{ type: "chart", chart: { kind: "pie", labels: ["a", "b"], series: [{ name: "s", values: [1, 3] }] } }])).toContain("<path");
    expect(html([{ type: "chart", chart: { kind: "line", labels: ["a", "b"], series: [{ name: "s", values: [1, 3] }] } }])).toContain("<polyline");
    expect(html([{ type: "diagram", diagram: { kind: "flowchart", caption: "Flux", mermaid: "flowchart TD; A-->B" } }])).toContain("Flux");
  });

  it("ignore un type inconnu ou un bloc sans donnée sans casser le reste", () => {
    const out = html([
      { type: "hologram", text: "futur" },
      { type: "table" },
      { type: "list", list_items: [] },
      { type: "text", text: "Reste affiché." },
    ]);

    expect(out.match(/<div>/g)).toHaveLength(1); // seul le bloc texte valide est rendu
    expect(out).not.toContain("<table");
  });

  it("rend une image ré-hébergée via /api/media, jamais de hotlink", () => {
    const out = html([
      {
        type: "image",
        image_caption: "Un schéma",
        image: { asset_id: "abc-123", url: "/media/abc-123", alt: "texte alternatif", width: 800, height: 600 },
      },
    ]);

    expect(out).toContain('src="/api/media/abc-123"');
    expect(out).toContain('alt="texte alternatif"');
    expect(out).toContain("Un schéma");
    expect(out).not.toContain("http"); // jamais d'URL externe directe
  });

  it("affiche l'attribution obligatoire pour une image sous licence CC", () => {
    const out = html([
      {
        type: "image",
        image: {
          asset_id: "xyz",
          url: "/media/xyz",
          width: 400,
          height: 300,
          attribution: { author: "Jane Doe", license: "CC BY-SA 4.0", license_url: "https://example.org/license" },
        },
      },
    ]);

    expect(out).toContain("Jane Doe");
    expect(out).toContain("CC BY-SA 4.0");
    expect(out).toContain('href="https://example.org/license"');
  });

  it("un bloc image sans image résolue ne rend rien (jamais de bloc image cassé)", () => {
    const out = html([{ type: "image", image_caption: "Légende orpheline" }]);
    expect(out).toBe("");
  });
});

describe("chartGeometry", () => {
  it("pieSlices ignore les valeurs négatives et couvre le cercle", () => {
    const slices = pieSlices([1, -5, 3]);
    expect(slices[2].end).toBeCloseTo(Math.PI * 2);
    expect(slices[1].end - slices[1].start).toBe(0);
    expect(pieSlices([0, 0])).toEqual([]);
  });

  it("axisMax n'est jamais nul", () => {
    expect(axisMax([[0, 0]])).toBe(1);
    expect(axisMax([[2, 5], [7]])).toBe(7);
  });
});
