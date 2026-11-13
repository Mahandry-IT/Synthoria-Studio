import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ExercisesPanelView } from "./ExercisesPanelView";
import { GenerateExercisesDialog } from "./GenerateExercisesDialog";
import { exerciseListSchema } from "../exercise.schema";
import type { ExerciseList } from "../exercise.types";

const ID = "3f2b8a52-0d7c-4f6e-9c1a-6d5e4b3a2f10";
const titles = { s1: "Les matrices" };

function panel(data: ExerciseList | undefined, loadError?: string) {
  return renderToStaticMarkup(
    createElement(ExercisesPanelView, { data, loadError, sectionTitles: titles, onGenerate: vi.fn() }),
  );
}
const list = (over: Partial<ExerciseList>): ExerciseList => ({
  status: "done",
  error_message: null,
  exercises: [],
  ...over,
});

describe("ExercisesPanelView", () => {
  it("absent : propose de générer", () => {
    expect(panel(list({ status: "absent" }))).toContain("Générer les exercices");
  });

  it("pending / generating : avancement sans bouton", () => {
    const html = panel(list({ status: "generating" }));
    expect(html).toContain("en cours");
    expect(html).not.toContain("<button");
    expect(panel(list({ status: "pending" }))).toContain("en attente");
  });

  it("failed : message d'erreur et Réessayer", () => {
    const html = panel(list({ status: "failed", error_message: "Quota dépassé" }));
    expect(html).toContain("Quota dépassé");
    expect(html).toContain("Réessayer");
  });

  it("done sans exercice : aucun exercice nécessaire", () => {
    expect(panel(list({}))).toContain("aucun exercice");
  });

  it("done : titre, section par son titre, couverture, sans identifiant brut de section", () => {
    const data = list({
      exercises: [{ id: ID, section_id: "s1", position: 1, title: "Produit matriciel", covers: "Savoir multiplier" }],
    });
    const html = panel(data);
    expect(html).toContain("Produit matriciel");
    expect(html).toContain("Section : Les matrices");
    expect(html).toContain("Savoir multiplier");
    expect(html).not.toContain(">s1<");
  });

  it("n'affiche aucun énoncé : le schéma de liste l'écarte avant la vue (RG-8)", () => {
    const parsed = exerciseListSchema.parse({
      status: "done",
      exercises: [{ id: ID, section_id: "s1", position: 1, title: "Produit matriciel", statement: "ÉNONCÉ SECRET" }],
    });
    expect(panel(parsed)).not.toContain("ÉNONCÉ SECRET");
  });

  it("échappe le texte (pas de HTML)", () => {
    const data = list({ exercises: [{ id: ID, section_id: null, position: 1, title: "<img src=x onerror=1>", covers: "" }] });
    expect(panel(data)).not.toContain("<img");
  });

  it("chargement et erreur de chargement", () => {
    expect(panel(undefined)).toContain("Chargement");
    expect(panel(undefined, "Erreur réseau")).toContain("Erreur réseau");
  });

  it("erreur de lecture : Réessayer seulement si un rappel est fourni", () => {
    const withRetry = renderToStaticMarkup(
      createElement(ExercisesPanelView, {
        data: undefined,
        loadError: "Erreur réseau",
        sectionTitles: titles,
        onGenerate: vi.fn(),
        onRetryLoad: vi.fn(),
      }),
    );
    expect(withRetry).toContain("Réessayer");
    expect(panel(undefined, "Erreur réseau")).not.toContain("Réessayer");
  });
});

describe("GenerateExercisesDialog", () => {
  it("expose un dialogue nommé avec Oui et Non", () => {
    const html = renderToStaticMarkup(
      createElement(GenerateExercisesDialog, { onAccept: vi.fn(), onDecline: vi.fn() }),
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-labelledby="generate-exercises-title"');
    expect(html).toContain("Générer les exercices ?");
    expect(html).toContain("Non");
    expect(html).toContain("Oui, générer");
  });
});
