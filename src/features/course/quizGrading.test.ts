import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "./course.types";
import { isAnswerCorrect, optionFeedback } from "./quizGrading";

const question: QuizQuestion = {
  question: "Q",
  options: ["A", "B", "C"],
  correct_option_indices: [1],
  difficulty: "facile",
  points: 1,
  explanation_per_choice: ["non A", "oui B", "non C"],
};

describe("quizGrading", () => {
  it("isAnswerCorrect exige exactement les bonnes réponses", () => {
    expect(isAnswerCorrect(question, [1])).toBe(true);
    expect(isAnswerCorrect(question, [0])).toBe(false);
    expect(isAnswerCorrect(question, [1, 2])).toBe(false);
    expect(isAnswerCorrect(question, [])).toBe(false);
    expect(isAnswerCorrect({ ...question, correct_option_indices: [0, 2] }, [2, 0, 2])).toBe(true);
  });

  it("optionFeedback commente l'option choisie et la bonne réponse, pas les autres", () => {
    const feedback = optionFeedback(question, [0]);

    expect(feedback.map((f) => [f.index, f.text, f.chosen, f.isCorrectOption])).toEqual([
      [0, "non A", true, false],
      [1, "oui B", false, true],
    ]);
  });

  it("tolère l'absence d'explications par option", () => {
    const { explanation_per_choice: _omit, ...bare } = question;
    void _omit;

    expect(optionFeedback(bare, [1])).toEqual([{ index: 1, isCorrectOption: true, chosen: true, text: "" }]);
  });
});
