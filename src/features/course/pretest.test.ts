import { describe, expect, it } from "vitest";
import type { PretestItem } from "./course.types";
import { toEditable, toPlannedSections } from "./planEditing";
import { applyMastery, isCorrect, masteredTitles, relevantPretest } from "./pretest";

const item = (title: string, correct: number[]): PretestItem => ({
  section_title: title,
  question: { question: "Q", options: ["a", "b", "c"], correct_option_indices: correct, difficulty: "normale", points: 1 },
});

const plan = toEditable([
  { type: "introduction", title: "Intro", objective: "", subtopics: [], order: 1 },
  { type: "development", title: "Principe", objective: "", subtopics: [], order: 2 },
  { type: "development", title: "Rendement", objective: "", subtopics: [], order: 3 },
]);

describe("pré-test", () => {
  it("isCorrect exige exactement les bonnes réponses", () => {
    expect(isCorrect(item("P", [1]), [1])).toBe(true);
    expect(isCorrect(item("P", [1]), [0])).toBe(false);
    expect(isCorrect(item("P", [0, 2]), [2, 0])).toBe(true);
    expect(isCorrect(item("P", [0, 2]), [0])).toBe(false);
    expect(isCorrect(item("P", [1]), [])).toBe(false);
  });

  it("marque « déjà maîtrisée » uniquement les sections réussies, jamais l'introduction", () => {
    const pretest = [item("Principe", [1]), item("Rendement", [0])];
    const mastered = masteredTitles(pretest, { Principe: [1], Rendement: [2] });

    const result = applyMastery(plan, mastered);

    expect(result.map((s) => s.mastery)).toEqual([null, "known", null]);
    expect(applyMastery(result, new Set()).map((s) => s.mastery)).toEqual([null, null, null]); // pré-test refait
  });

  it("envoie mastery au backend seulement pour les sections maîtrisées", () => {
    const planned = toPlannedSections(applyMastery(plan, new Set(["principe"])));

    expect(planned.find((s) => s.title === "Principe")?.mastery).toBe("known");
    expect("mastery" in planned.find((s) => s.title === "Rendement")!).toBe(false);
  });

  it("relevantPretest ignore les questions dont la section a été supprimée du plan", () => {
    const edited = plan.filter((s) => s.title !== "Rendement");

    expect(relevantPretest([item("Principe", [0]), item("rendement", [0])], edited).map((i) => i.section_title)).toEqual([
      "Principe",
    ]);
  });
});
