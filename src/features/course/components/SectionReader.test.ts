import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EMPTY_PROGRESS, type SectionProgress } from "../sectionProgress";
import type { CourseSection, CourseVideo } from "../course.types";
import { SectionReader } from "./SectionReader";

// LatexText remplit le DOM dans un effet (absent du rendu serveur) : on le remplace par un
// rendu texte React, qui échappe tout HTML.
vi.mock("@/shared/utils/latex", () => ({
  LatexText: ({ text }: { text: string }) => createElement("span", null, text),
}));

const video = (id: string): CourseVideo => ({
  video_id: id,
  url: `https://www.youtube.com/watch?v=${id}`,
  embed_url: `https://www.youtube.com/embed/${id}`,
  thumbnail_url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  title: `Vidéo ${id}`,
});

const legacy: CourseSection = { id: "s1", title: "Ancienne", quoi: "Q", pourquoi: "P", comment: "C" };

const progressive: CourseSection = {
  id: "s2",
  title: "Nouvelle",
  challenge: "Défi ?",
  subsections: [{ title: "Pourquoi", blocks: [{ type: "paragraph", text: "texte" }] }],
  key_takeaways: ["Retenir A", "Retenir B"],
  pitfalls_to_avoid: [{ mistake: "Erreur X", how_to_avoid: "Faire Y" }],
} as CourseSection;

const render = (section: CourseSection, progress: SectionProgress = EMPTY_PROGRESS, videos: CourseVideo[] = [], onDoExercise?: () => void) =>
  renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: new QueryClient() },
      createElement(SectionReader, {
        section,
        index: 0,
        progressKey: section.id ?? "#0",
        headingId: "h",
        progress,
        update: () => {},
        onOverride: () => {},
        videos,
        onDoExercise,
      }),
    ),
  );

describe("SectionReader — encadrés de fin de section", () => {
  it("ancien cours : aucun encadré, aucune régression de contenu", () => {
    const out = render(legacy);
    expect(out).not.toContain("Ce qu&#x27;il faut retenir");
    expect(out).not.toContain("Ce qu&#x27;il faut éviter");
    expect(out).toContain("Ancienne");
  });

  it("section progressive : encadrés masqués tant que les étapes ne sont pas terminées", () => {
    expect(render(progressive)).not.toContain("Retenir A");
  });

  it("section terminée : encadrés retenir et éviter affichés", () => {
    const out = render(progressive, { unlocked: ["s2"], done: ["s2"] });
    expect(out).toContain("Ce qu&#x27;il faut retenir");
    expect(out).toContain("Retenir A");
    expect(out).toContain("Ce qu&#x27;il faut éviter");
    expect(out).toContain("Erreur X");
    expect(out).toContain("Comment l&#x27;éviter");
    expect(out).toContain("Faire Y");
  });

  it("listes vides ou textes blancs : aucun encadré", () => {
    const out = render(
      { ...progressive, key_takeaways: ["  "], pitfalls_to_avoid: [{ mistake: " ", how_to_avoid: "x" }] },
      { unlocked: ["s2"], done: ["s2"] },
    );
    expect(out).not.toContain("Ce qu&#x27;il faut retenir");
    expect(out).not.toContain("Ce qu&#x27;il faut éviter");
  });

  it("dernière étape dévoilée mais non terminée : encadrés et vidéos masqués, puis affichés une fois terminée", () => {
    const withCheck = {
      ...progressive,
      check_questions: [{ kind: "choice", question: "Q ?", options: ["a", "b"], correct_option_indices: [0], explanation: "E" }],
    } as unknown as CourseSection;
    const mid = render(withCheck, { unlocked: ["s2"], done: [], revealed: { s2: 3 } }, [video("aaaaaaaaaaa")]);
    expect(mid).toContain("Étape 3 sur 3");
    expect(mid).not.toContain("Retenir A");
    expect(mid).not.toContain("Erreur X");
    expect(mid).not.toContain("Vidéo de cette section");
    const end = render(withCheck, { unlocked: ["s2"], done: ["s2"] }, [video("aaaaaaaaaaa")]);
    expect(end).toContain("Retenir A");
    expect(end).toContain("Vidéo de cette section");
  });

  // Le mock de LatexText échappe via React : ce test prouve l'échappement du rendu du composant
  // et de ce mock, pas celui du vrai LatexText (qui injecte dans le DOM via un effet, hors rendu serveur).
  it("n'interprète pas le HTML des textes générés", () => {
    const out = render(
      { ...progressive, key_takeaways: ["<img src=x onerror=alert(1)>"] },
      { unlocked: ["s2"], done: ["s2"] },
    );
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
  });

  it("un seul encadré présent si l'autre est vide", () => {
    const out = render({ ...progressive, pitfalls_to_avoid: [] }, { unlocked: ["s2"], done: ["s2"] });
    expect(out).toContain("Ce qu&#x27;il faut retenir");
    expect(out).not.toContain("Ce qu&#x27;il faut éviter");
  });
});

describe("SectionReader — vidéos de la section", () => {
  it("sans vidéo : aucun bloc vidéo", () => {
    expect(render(legacy)).not.toContain("Vidéo de cette section");
  });

  it("vidéos affichées après les encadrés", () => {
    const out = render(progressive, { unlocked: ["s2"], done: ["s2"] }, [video("aaaaaaaaaaa")]);
    expect(out).toContain("Vidéo de cette section");
    expect(out.indexOf("Ce qu&#x27;il faut éviter")).toBeLessThan(out.indexOf("Vidéo de cette section"));
  });

  it("deux vidéos : titre au pluriel", () => {
    expect(render(legacy, EMPTY_PROGRESS, [video("aaaaaaaaaaa"), video("bbbbbbbbbbb")])).toContain("Vidéos de cette section");
  });
});

describe("SectionReader : bouton « Faire l'exercice »", () => {
  const done = { unlocked: ["s2"], done: ["s2"] };
  const doExercise = () => {};

  it("exercice disponible et section terminée : bouton affiché après les encadrés", () => {
    const out = render(progressive, done, [], doExercise);
    expect(out).toContain("Faire l&#x27;exercice");
    expect(out.indexOf("Ce qu&#x27;il faut éviter")).toBeLessThan(out.indexOf("Faire l&#x27;exercice"));
  });

  it("section ancienne sans question : bouton affiché en fin de section", () => {
    expect(render(legacy, EMPTY_PROGRESS, [], doExercise)).toContain("Faire l&#x27;exercice");
  });

  it("pas d'exercice pour la section (liste absente, en cours ou échouée) : aucun bouton", () => {
    expect(render(progressive, done)).not.toContain("Faire l&#x27;exercice");
  });

  it("section progressive non terminée : pas de bouton", () => {
    expect(render(progressive, EMPTY_PROGRESS, [], doExercise)).not.toContain("Faire l&#x27;exercice");
  });

  it("l'ancre de la section porte l'id attendu par « Retour à la section »", () => {
    expect(render(progressive, done)).toContain('id="section-anchor-s2"');
  });
});
