import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SectionAside } from "./SectionAside";
import { SectionNav, type SectionNavItem } from "./SectionNav";

// LatexText remplit le DOM dans un effet (absent du rendu serveur) : rendu texte React.
vi.mock("@/shared/utils/latex", () => ({
  LatexText: ({ text }: { text: string }) => createElement("span", null, text),
}));

const items: SectionNavItem[] = [
  { key: "a", title: "Adresses", status: "done", duration: "~3 min" },
  { key: "b", title: "Pagination", status: "in_progress", duration: "4–6 min" },
  { key: "c", title: "Table des pages", status: "in_progress" },
  { key: "d", title: "TLB", status: "todo" },
];

const nav = (currentKey: string | null) =>
  renderToStaticMarkup(createElement(SectionNav, { items, currentKey, onSelect: () => {} }));

describe("SectionNav", () => {
  it("un bouton par section, dans une navigation nommée", () => {
    const out = nav("b");
    expect(out).toContain('aria-label="Sections du cours"');
    expect(out.match(/<li /g)).toHaveLength(items.length);
    expect(out.match(/<li [^>]*><button/g)).toHaveLength(items.length);
  });

  it("aria-current=step sur le seul chapitre courant", () => {
    const out = nav("b");
    expect(out.match(/aria-current="step"/g)).toHaveLength(1);
    expect(out).toMatch(/aria-current="step"[^>]*>(?:(?!<\/button>).)*Pagination/);
  });

  it("textes masqués d'état et de durée conservés pour toutes les sections", () => {
    const out = nav("b");
    expect(out).toContain("(faite)");
    expect(out).toContain("(à faire)");
    expect(out).toContain("(en cours)");
    expect(out).toContain("(durée estimée ~3 min)");
    expect(out).toContain("(durée estimée 4–6 min)");
  });

  it("durée visible seulement sur le chapitre courant", () => {
    const visible = nav("b").match(/aria-hidden="true"[^>]*>[^<]*min</g) ?? [];
    expect(visible).toHaveLength(1);
    expect(visible[0]).toContain("4–6 min");
  });

  it("numéros à deux chiffres et titres lisibles par les lecteurs d'écran sur mobile", () => {
    const out = nav("a");
    expect(out).toContain(">01<");
    expect(out).toContain("04");
    expect(out).toMatch(/sr-only sm:not-sr-only[^>]*><span>Pagination<\/span>/);
  });

  it("chevrons de défilement nommés, non actifs avant la mesure", () => {
    const out = nav("a");
    expect(out).toContain('aria-label="Sections précédentes"');
    expect(out).toContain('aria-label="Sections suivantes"');
    expect(out).not.toMatch(/aria-label="Sections (précédentes|suivantes)"[^>]*\sdisabled/);
  });

  it("défilement horizontal sans barre, repère de fondu éteint avant la mesure", () => {
    const out = nav(null);
    expect(out).toContain("overflow-x-auto");
    expect(out).toContain('data-fade-end="false"');
    expect(out).not.toContain("aria-current");
  });
});

describe("SectionAside", () => {
  it("numéro, total et durée du cours en cycle ; masquée sous xl", () => {
    const out = renderToStaticMarkup(
      createElement(SectionAside, { index: 3, total: 12, duration: "~5 min", summary: "2/5 terminées" }),
    );
    expect(out).toContain(">04<");
    expect(out).toContain("sur 12 sections");
    expect(out).toContain("Section 4 ");
    expect(out).toContain("~5 min");
    expect(out).toContain("2/5 terminées");
    expect(out).toContain("hidden xl:block");
  });

  it("données absentes : ni durée ni résumé affichés", () => {
    const out = renderToStaticMarkup(createElement(SectionAside, { index: 0, total: 1 }));
    expect(out).toContain("sur 1 section");
    expect(out).not.toContain("<ul");
    expect(out).not.toMatch(/\d+ min/);
  });
});
