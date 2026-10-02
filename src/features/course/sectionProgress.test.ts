import { describe, expect, it } from "vitest";
import {
  adjacentSection,
  buildLearningSteps,
  completeSection,
  EMPTY_PROGRESS,
  fadedRevealedCount,
  isExplanationVisible,
  isFullyRevealed,
  isProgressive,
  isTrackable,
  resolveCurrentSection,
  revealedStepCount,
  revealFadedStep,
  revealNextStep,
  sectionKey,
  sectionStatus,
  setCurrentSection,
  subsectionKind,
  unlockSection,
} from "./sectionProgress";
import type { CourseSection, QuizQuestion } from "./course.types";

const block = { type: "text", text: "x" };
const question = { question: "Q", options: ["A", "B"], correct_option_indices: [0] } as QuizQuestion;
const fullSection: CourseSection = {
  id: "s1",
  title: "S",
  challenge: "Que se passe-t-il ?",
  subsections: [
    { title: "Pourquoi", blocks: [block] },
    { title: "Quoi", blocks: [block] },
    { title: "Vide", blocks: [] },
    { title: "Comment", blocks: [block] },
    { title: "Pour aller plus loin", blocks: [block] },
  ],
  faded_example: { statement: "s", given_steps: ["1"], hidden_steps: ["2", "3"] },
  check_questions: [question],
  recall_prompt: { prompt: "Explique." },
};

describe("étapes du cycle", () => {
  it("ordonne défi → sous-sections → à toi → vérifie → explique, sans sous-section vide", () => {
    const steps = buildLearningSteps(fullSection, true);
    expect(steps.map((s) => s.kind)).toEqual([
      "challenge", "pourquoi", "quoi", "comment", "generic", "a_toi", "verifie", "explique",
    ]);
    expect(steps.find((s) => s.kind === "comment")?.subsectionIndex).toBe(3);
  });

  it("sans session (canRecall=false) ni exemple ni questions : pas d'étapes correspondantes", () => {
    const steps = buildLearningSteps(
      { ...fullSection, faded_example: null, check_questions: [] },
      false,
    );
    expect(steps.map((s) => s.kind)).toEqual(["challenge", "pourquoi", "quoi", "comment", "generic"]);
  });

  it("reconnaît les titres standard malgré accents, casse et numérotation", () => {
    expect(subsectionKind("1. POURQUOI c'est utile")).toBe("pourquoi");
    expect(subsectionKind("Qu'est-ce que c'est ?")).toBe("quoi");
    expect(subsectionKind("Comment l'appliquer")).toBe("comment");
    expect(subsectionKind("Exemple")).toBe("generic");
    expect(subsectionKind(undefined)).toBe("generic");
  });

  it("progressif seulement avec défi et contenu par blocs (sessions historiques : affichage complet)", () => {
    expect(isProgressive(fullSection)).toBe(true);
    expect(isProgressive({ ...fullSection, challenge: "  " })).toBe(false);
    expect(isProgressive({ ...fullSection, subsections: [] })).toBe(false);
    expect(isProgressive({ challenge: "Défi", subsections: [{ title: "Quoi", blocks: [] }] })).toBe(false);
  });
});

describe("dévoilement progressif", () => {
  it("affiche d'abord une étape puis dévoile une à une, sans dépasser le total", () => {
    expect(revealedStepCount(EMPTY_PROGRESS, "s1", 4)).toBe(1);
    let p = revealNextStep(EMPTY_PROGRESS, "s1", 4);
    expect(revealedStepCount(p, "s1", 4)).toBe(2);
    p = revealNextStep(revealNextStep(revealNextStep(p, "s1", 4), "s1", 4), "s1", 4);
    expect(revealedStepCount(p, "s1", 4)).toBe(4);
    expect(isFullyRevealed(p, "s1", 4)).toBe(true);
  });

  it("dépasser le défi déverrouille la section", () => {
    expect(revealNextStep(EMPTY_PROGRESS, "s1", 3).unlocked).toEqual(["s1"]);
  });

  it("reprend une progression enregistrée avant le lecteur progressif", () => {
    expect(revealedStepCount(unlockSection(EMPTY_PROGRESS, "s1"), "s1", 5)).toBe(2);
    expect(revealedStepCount(completeSection(EMPTY_PROGRESS, "s1"), "s1", 5)).toBe(5);
    expect(revealedStepCount(EMPTY_PROGRESS, "s1", 0)).toBe(0);
  });

  it("compte persisté des étapes de l'exemple à trous, borné", () => {
    let p = revealFadedStep(EMPTY_PROGRESS, "s1", 2);
    p = revealFadedStep(revealFadedStep(p, "s1", 2), "s1", 2);
    expect(fadedRevealedCount(p, "s1", 2)).toBe(2);
    expect(fadedRevealedCount(EMPTY_PROGRESS, "s1", 2)).toBe(0);
  });

  it("conserve les autres champs lors des transitions", () => {
    const p = completeSection(setCurrentSection(revealNextStep(EMPTY_PROGRESS, "a", 3), "a"), "b");
    expect(p.current).toBe("a");
    expect(p.revealed).toEqual({ a: 2 });
  });
});

describe("navigation entre sections", () => {
  const keys = ["a", "b", "c"];

  it("section courante mémorisée, sinon la première", () => {
    expect(resolveCurrentSection(EMPTY_PROGRESS, keys)).toBe("a");
    expect(resolveCurrentSection(setCurrentSection(EMPTY_PROGRESS, "b"), keys)).toBe("b");
    expect(resolveCurrentSection(setCurrentSection(EMPTY_PROGRESS, "z"), keys)).toBe("a");
    expect(resolveCurrentSection(EMPTY_PROGRESS, [])).toBeNull();
  });

  it("précédente / suivante, null en bout de liste", () => {
    expect(adjacentSection(keys, "b", -1)).toBe("a");
    expect(adjacentSection(keys, "b", 1)).toBe("c");
    expect(adjacentSection(keys, "a", -1)).toBeNull();
    expect(adjacentSection(keys, "c", 1)).toBeNull();
    expect(adjacentSection(keys, null, 1)).toBeNull();
  });

  it("état faite / en cours / à faire", () => {
    expect(sectionStatus(EMPTY_PROGRESS, "a")).toBe("todo");
    expect(sectionStatus(setCurrentSection(EMPTY_PROGRESS, "a"), "a")).toBe("in_progress");
    expect(sectionStatus(revealNextStep(EMPTY_PROGRESS, "a", 3), "a")).toBe("in_progress");
    expect(sectionStatus(completeSection(EMPTY_PROGRESS, "a"), "a")).toBe("done");
  });
});

describe("sectionProgress", () => {
  it("l'explication est visible sans défi ou après l'avoir relevé", () => {
    expect(isExplanationVisible(EMPTY_PROGRESS, "1", false)).toBe(true);
    expect(isExplanationVisible(EMPTY_PROGRESS, "1", true)).toBe(false);
    expect(isExplanationVisible(unlockSection(EMPTY_PROGRESS, "1"), "1", true)).toBe(true);
  });

  it("terminer une section la déverrouille aussi, sans doublon", () => {
    const done = completeSection(completeSection(EMPTY_PROGRESS, "2"), "2");

    expect(done).toEqual({ unlocked: ["2"], done: ["2"] });
    expect(isExplanationVisible(done, "2", true)).toBe(true);
  });

  it("ne modifie pas l'état d'origine", () => {
    unlockSection(EMPTY_PROGRESS, "1");
    expect(EMPTY_PROGRESS).toEqual({ unlocked: [], done: [] });
  });

  it("sectionKey retombe sur la position, isTrackable exige des questions", () => {
    expect(sectionKey("7", 0)).toBe("7");
    expect(sectionKey(undefined, 3)).toBe("#3");
    expect(isTrackable(0)).toBe(false);
    expect(isTrackable(2)).toBe(true);
  });
});
