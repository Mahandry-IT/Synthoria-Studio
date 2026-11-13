import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ExerciseBeforeCard } from "./ExerciseBeforeCard";
import { ExerciseFeedbackView } from "./ExerciseFeedbackView";
import { ExerciseHints } from "./ExerciseHints";
import { ExerciseStatement } from "./ExerciseStatement";
import { ExerciseTimer } from "./ExerciseTimer";
import { exerciseDetailSchema, exerciseFeedbackSchema } from "../exercise.schema";
import type { ExerciseSummary } from "../exercise.types";

// LatexText remplit le DOM dans un effet (absent du rendu serveur) : rendu texte échappé par React.
vi.mock("@/shared/utils/latex", () => ({
  LatexText: ({ text }: { text: string }) => createElement("span", null, text),
}));

const ID = "3f2b8a52-0d7c-4f6e-9c1a-6d5e4b3a2f10";
const SECRET_STATEMENT = "ÉNONCÉ-SECRET";
const SECRET_HINT = "INDICE-SECRET";

const summary: ExerciseSummary = {
  id: ID,
  section_id: "s1",
  position: 1,
  title: "Multiplier deux matrices",
  covers: "Produit matriciel",
  duration_minutes: 15,
};

describe("carte « avant » (RG-8)", () => {
  const html = renderToStaticMarkup(
    createElement(ExerciseBeforeCard, { exercise: summary, sectionTitle: "Les matrices", onStart: vi.fn() }),
  );

  it("titre, section, couverture, durée et bouton Commencer", () => {
    expect(html).toContain("Multiplier deux matrices");
    expect(html).toContain("Section : Les matrices");
    expect(html).toContain("Produit matriciel");
    expect(html).toContain("15 min");
    expect(html).toContain("Commencer");
  });

  it("aucun énoncé ni indice dans le DOM, même si le résumé en portait", () => {
    const leaky = { ...summary, statement: [{ type: "text", text: SECRET_STATEMENT }], hints: [SECRET_HINT] };
    const out = renderToStaticMarkup(
      createElement(ExerciseBeforeCard, { exercise: leaky as ExerciseSummary, onStart: vi.fn() }),
    );
    expect(out).not.toContain(SECRET_STATEMENT);
    expect(out).not.toContain(SECRET_HINT);
    expect(out).not.toContain("Indice");
  });

  it("durée inconnue : pas de ligne de durée", () => {
    const out = renderToStaticMarkup(
      createElement(ExerciseBeforeCard, { exercise: { ...summary, duration_minutes: null }, onStart: vi.fn() }),
    );
    expect(out).not.toContain("Durée prévue");
  });
});

describe("énoncé", () => {
  it("rend les blocs valides et ignore les invalides", () => {
    const detail = exerciseDetailSchema.parse({
      id: ID,
      title: "t",
      statement: [
        { type: "text", text: SECRET_STATEMENT },
        { type: "list", list_items: ["un", "deux"] },
        42,
        { type: "inconnu" },
      ],
      hints: [],
      duration_minutes: 5,
    });
    const out = renderToStaticMarkup(createElement(ExerciseStatement, { blocks: detail.statement }));
    expect(out).toContain(SECRET_STATEMENT);
    expect(out).toContain("deux");
    expect(out).toContain("Énoncé");
  });

  it("n'interprète pas le HTML du texte généré", () => {
    const out = renderToStaticMarkup(
      createElement(ExerciseStatement, { blocks: [{ type: "text", text: "<img src=x onerror=alert(1)>" }] }),
    );
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
  });

  it("énoncé inexploitable : message adapté, pas de page cassée", () => {
    expect(renderToStaticMarkup(createElement(ExerciseStatement, { blocks: [] }))).toContain("indisponible");
  });
});

describe("minuteur", () => {
  it("décompte visible en role=timer, sans indicateur avant la fin", () => {
    const out = renderToStaticMarkup(
      createElement(ExerciseTimer, { startedAt: performance.now(), durationMinutes: 10 }),
    );
    expect(out).toContain('role="timer"');
    expect(out).toMatch(/\d{2}:\d{2}/);
    expect(out).not.toContain("Temps écoulé");
  });

  it("à zéro : indicateur « Temps écoulé » et 00:00", () => {
    const out = renderToStaticMarkup(
      createElement(ExerciseTimer, { startedAt: performance.now() - 3_600_000, durationMinutes: 10 }),
    );
    expect(out).toContain("00:00");
    expect(out).toContain("Temps écoulé");
  });

  it("correction reçue : plus d'indicateur ; sans durée : pas de minuteur", () => {
    const stopped = renderToStaticMarkup(
      createElement(ExerciseTimer, { startedAt: 0, durationMinutes: 10, stopped: true }),
    );
    expect(stopped).not.toContain("Temps écoulé");
    expect(renderToStaticMarkup(createElement(ExerciseTimer, { startedAt: 0, durationMinutes: null }))).toBe("");
  });
});

describe("indices", () => {
  const hints = ["général", "précis"];
  const render = (revealed: number) =>
    renderToStaticMarkup(createElement(ExerciseHints, { hints, revealed, onReveal: vi.fn() }));

  it("masqués au départ, bouton Indice suivant", () => {
    const out = render(0);
    expect(out).not.toContain("général");
    expect(out).toContain("Indice suivant");
  });

  it("un par un, puis plus de bouton", () => {
    expect(render(1)).toContain("général");
    expect(render(1)).not.toContain("précis");
    const all = render(2);
    expect(all).toContain("précis");
    expect(all).not.toContain("Indice suivant");
  });

  it("sans indice : rien", () => {
    expect(renderToStaticMarkup(createElement(ExerciseHints, { hints: [], revealed: 0, onReveal: vi.fn() }))).toBe("");
  });
});

describe("retour de correction (RG-1)", () => {
  const feedback = exerciseFeedbackSchema.parse({
    feedback: "Bonne démarche.",
    correct_points: ["Dimensions vérifiées"],
    missing_points: ["Oubli de la somme"],
    expected_approach: "Multiplier ligne par colonne.",
    score: 18,
    grade: "A",
  });
  const out = renderToStaticMarkup(createElement(ExerciseFeedbackView, { feedback, onRedo: vi.fn() }));

  it("juste, manquant, démarche attendue et bouton Refaire", () => {
    expect(out).toContain("Ce qui est juste");
    expect(out).toContain("Dimensions vérifiées");
    expect(out).toContain("Ce qui manque");
    expect(out).toContain("Oubli de la somme");
    expect(out).toContain("Démarche attendue");
    expect(out).toContain("Refaire l&#x27;exercice");
  });

  it("aucun score ni note", () => {
    expect(out).not.toMatch(/score|note\b|\/\s?20|points? obtenus|18/i);
    expect(out).not.toContain("grade");
  });

  it("correction sans point manquant : section absente", () => {
    const partial = exerciseFeedbackSchema.parse({ feedback: "Parfait." });
    const html = renderToStaticMarkup(createElement(ExerciseFeedbackView, { feedback: partial, onRedo: vi.fn() }));
    expect(html).not.toContain("Ce qui manque");
    expect(html).not.toContain("Démarche attendue");
  });
});
