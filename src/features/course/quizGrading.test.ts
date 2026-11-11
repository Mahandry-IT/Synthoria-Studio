import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "./course.types";
import {
  availableOptions,
  isAnswerCorrect,
  isMatchingCorrect,
  isNumericCorrect,
  isQuestionCorrect,
  optionFeedback,
  parseNumericInput,
  questionKind,
} from "./quizGrading";

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

describe("quizGrading numérique", () => {
  it("valeur attendue entière : égalité stricte", () => {
    expect(isNumericCorrect(4, 4)).toBe(true);
    expect(isNumericCorrect(4, 4.0)).toBe(true);
    expect(isNumericCorrect(4, 4.0001)).toBe(false);
    expect(isNumericCorrect(4, 3.9999)).toBe(false);
  });

  it("valeur attendue décimale : tolérance 0,0001", () => {
    expect(isNumericCorrect(0.3333, 0.33333)).toBe(true);
    expect(isNumericCorrect(0.3333, 0.3334)).toBe(true);
    expect(isNumericCorrect(0.3333, 0.33)).toBe(false);
  });

  it("vide, NaN, infini ou attendu inconnu : faux", () => {
    expect(isNumericCorrect(4, null)).toBe(false);
    expect(isNumericCorrect(4, Number.NaN)).toBe(false);
    expect(isNumericCorrect(4, Infinity)).toBe(false);
    expect(isNumericCorrect(null, 4)).toBe(false);
  });

  it("parseNumericInput accepte virgule, point et espaces ; refuse le reste", () => {
    expect(parseNumericInput("0,5")).toBe(0.5);
    expect(parseNumericInput(" 1 000,25 ")).toBe(1000.25);
    expect(parseNumericInput("-3.2")).toBe(-3.2);
    expect(parseNumericInput("")).toBeNull();
    expect(parseNumericInput("abc")).toBeNull();
    expect(parseNumericInput("Infinity")).toBeNull();
  });
});

describe("quizGrading appariement", () => {
  it("isMatchingCorrect : tout ou rien", () => {
    expect(isMatchingCorrect([1, 0], [1, 0])).toBe(true);
    expect(isMatchingCorrect([1, 0], [1, 1])).toBe(false);
    expect(isMatchingCorrect([1, 0], [1, null])).toBe(false);
    expect(isMatchingCorrect([1, 0], [1])).toBe(false);
    expect(isMatchingCorrect([], [])).toBe(false);
  });

  it("availableOptions : exclusivité entre sujets, sélection propre conservée", () => {
    const options = ["A", "B", "C"];
    expect(availableOptions(options, [0, 2, null], 2).map((o) => o.index)).toEqual([1]);
    expect(availableOptions(options, [0, 2, null], 0).map((o) => o.index)).toEqual([0, 1]);
  });

  it("availableOptions : la valeur vide remet l'option à disposition", () => {
    const options = ["A", "B"];
    expect(availableOptions(options, [0, null], 1).map((o) => o.index)).toEqual([1]);
    expect(availableOptions(options, [null, null], 1).map((o) => o.index)).toEqual([0, 1]);
  });
});

describe("quizGrading selon le format", () => {
  it("une question sans kind est un choix", () => {
    expect(questionKind(question)).toBe("choice");
    expect(isQuestionCorrect(question, { questionIndex: 0, selectedOptionIndices: [1] })).toBe(true);
  });
});
