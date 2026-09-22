import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CourseVideo } from "../course.types";
import { VideoCards } from "./VideoCards";

const video = (overrides: Partial<CourseVideo> = {}): CourseVideo => ({
  video_id: "dQw4w9WgXcQ",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  title: "Titre",
  ...overrides,
});

const html = (videos: CourseVideo[]) => renderToStaticMarkup(createElement(VideoCards, { videos }));

describe("VideoCards", () => {
  it("n'affiche rien sans vidéo", () => {
    expect(html([])).toBe("");
  });

  it("affiche le badge de durée quand elle est connue", () => {
    expect(html([video({ duration_seconds: 754 })])).toContain("12:34");
  });

  it("n'affiche aucun badge sans durée connue", () => {
    const out = html([video({ duration_seconds: null })]);
    expect(out).not.toMatch(/\d+:\d{2}/);
  });

  it("affiche titre et chaîne", () => {
    const out = html([video({ title: "Cours complet", channel: "Ma Chaîne" })]);
    expect(out).toContain("Cours complet");
    expect(out).toContain("Ma Chaîne");
  });

  it("affiche les chips catégorie/niveau et la raison (V2)", () => {
    const out = html([video({ category: "exercices_corriges", level: "avance", relevance_reason: "Va droit au but." })]);
    expect(out).toContain("Exercices corrigés");
    expect(out).toContain("Avancé");
    expect(out).toContain("Va droit au but.");
  });

  it("n'affiche aucune section quand toutes les vidéos partagent une catégorie ou n'en ont pas", () => {
    const out = html([video({ video_id: "a1111111111" }), video({ video_id: "a2222222222" })]);
    expect(out).not.toContain("<h3");
  });

  it("regroupe sous des titres de catégorie dès que 2 catégories distinctes apparaissent, dans l'ordre", () => {
    const out = html([
      video({ video_id: "a1111111111", category: "cours" }),
      video({ video_id: "a2222222222", category: "methode" }),
    ]);
    expect((out.match(/<h3/g) ?? []).length).toBe(2);
    expect(out.indexOf(">Cours<")).toBeLessThan(out.indexOf("Méthode"));
  });
});
