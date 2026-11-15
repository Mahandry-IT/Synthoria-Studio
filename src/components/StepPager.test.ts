import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StepPager } from "./StepPager";

const html = (props: { current: number; revealed: number; total?: number; title?: string } & Record<string, unknown>) =>
  renderToStaticMarkup(
    h(StepPager, { total: 5, title: "Pourquoi", onChange: () => {}, label: "Étapes", ...props } as never, h("p", null, "contenu")),
  );

describe("StepPager", () => {
  it("flèches nommées, compteur visible et annonce aria-live", () => {
    const out = html({ current: 1, revealed: 3 });
    expect(out).toContain('aria-label="Étape précédente"');
    expect(out).toContain('aria-label="Étape suivante"');
    expect(out).toContain("2 / 5");
    expect(out).toMatch(/aria-live="polite">Étape 2 sur 5 : Pourquoi</);
    expect(out).toContain('aria-label="Étapes"');
    expect(out).toContain("contenu");
  });

  it("milieu de parcours : aucune flèche désactivée", () => {
    expect(html({ current: 1, revealed: 3 })).not.toContain('disabled=""');
  });

  it("première étape : « précédente » désactivée seulement", () => {
    const out = html({ current: 0, revealed: 3 });
    expect(out.match(/disabled=""/g)).toHaveLength(1);
    expect(out).toMatch(/disabled=""[^>]*aria-label="Étape précédente"/);
  });

  it("dernière étape dévoilée : « suivante » désactivée, même s'il reste des étapes verrouillées", () => {
    const out = html({ current: 2, revealed: 3 });
    expect(out.match(/disabled=""/g)).toHaveLength(1);
    expect(out).toMatch(/disabled=""[^>]*aria-label="Étape suivante"/);
  });

  it("une seule étape dévoilée : les deux flèches désactivées", () => {
    expect(html({ current: 0, revealed: 1 }).match(/disabled=""/g)).toHaveLength(2);
  });

  it("libellés personnalisables (cycle)", () => {
    const out = html({ current: 1, revealed: 3, unit: "Temps", previousLabel: "Temps précédent", nextLabel: "Temps suivant" });
    expect(out).toContain('aria-label="Temps suivant"');
    expect(out).toContain("Temps 2 sur 5 : Pourquoi");
  });

  it("zone d'étape : défilement vertical laissé au navigateur", () => {
    expect(html({ current: 0, revealed: 2 })).toContain("touch-pan-y");
  });
});
