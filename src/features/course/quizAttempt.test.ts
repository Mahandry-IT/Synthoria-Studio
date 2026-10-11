import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "./course.types";
import {
  formatScore,
  gradeFromServer,
  gradeLocally,
  scoreAppreciation,
  toSubmittedAnswers,
  upsertAnswer,
} from "./quizAttempt";
import {
  quizAttemptStartSchema,
  quizAttemptSubmitRequestSchema,
  quizAttemptSubmitResponseSchema,
} from "./quizAttempt.schema";

function question(points: number, correct: number[] = [0]): QuizQuestion {
  return {
    question: "Q",
    options: ["A", "B", "C"],
    correct_option_indices: correct,
    difficulty: "normale",
    points,
  };
}

describe("quizAttempt.schema", () => {
  it("démarrage : questions sans bonnes réponses, id normalisé en chaîne", () => {
    const parsed = quizAttemptStartSchema.parse({
      attempt_id: 12,
      questions: [{ question: "Q", options: ["A", "B"], points: 10 }],
    });
    expect(parsed.attempt_id).toBe("12");
    expect(parsed.questions[0].correct_option_indices).toEqual([]);
  });

  it("démarrage : refuse une série vide", () => {
    expect(quizAttemptStartSchema.safeParse({ attempt_id: "a", questions: [] }).success).toBe(false);
  });

  it("soumission : refuse des indices négatifs ou non entiers", () => {
    expect(quizAttemptSubmitRequestSchema.safeParse({ answers: [[0, 2], []] }).success).toBe(true);
    expect(quizAttemptSubmitRequestSchema.safeParse({ answers: [[-1]] }).success).toBe(false);
    expect(quizAttemptSubmitRequestSchema.safeParse({ answers: [[1.5]] }).success).toBe(false);
  });

  it("réponse : note nullable (tentative interrompue), max 20 par défaut", () => {
    const parsed = quizAttemptSubmitResponseSchema.parse({ score: null, status: "aborted" });
    expect(parsed).toEqual({ score: null, max_score: 20, status: "aborted", results: [] });
  });
});

describe("quizAttempt — réponses", () => {
  it("upsertAnswer remplace la réponse d'une question et garde l'ordre", () => {
    const answers = upsertAnswer(upsertAnswer([], 1, [0]), 0, [2]);
    expect(upsertAnswer(answers, 1, [1])).toEqual([
      { questionIndex: 0, selectedOptionIndices: [2] },
      { questionIndex: 1, selectedOptionIndices: [1] },
    ]);
  });

  it("toSubmittedAnswers : une entrée par question, vide si non répondue, sans doublon", () => {
    expect(toSubmittedAnswers(3, [{ questionIndex: 2, selectedOptionIndices: [1, 1, 0] }])).toEqual([[], [], [1, 0]]);
  });
});

describe("quizAttempt — notes", () => {
  it("repli local : note en points et non en nombre de questions", () => {
    const grade = gradeLocally(
      [question(4), question(6), question(10, [1, 2])],
      [
        { questionIndex: 0, selectedOptionIndices: [0] },
        { questionIndex: 2, selectedOptionIndices: [2, 1] },
      ],
    );
    expect(grade.score).toBe(14);
    expect(grade.maxScore).toBe(20);
    expect(grade.items.map((i) => i.correct)).toEqual([true, false, true]);
  });

  it("serveur : note /20 et corrections fusionnées dans les questions", () => {
    const drawn = [question(8, []), question(12, [])];
    const grade = gradeFromServer(drawn, {
      score: 12,
      max_score: 20,
      status: "completed",
      results: [
        { correct_option_indices: [1], explanation: "Parce que", explanation_per_choice: [], points_earned: 0 },
        { correct_option_indices: [0], explanation: "", explanation_per_choice: [], points_earned: 12, is_correct: true },
      ],
    });
    expect(grade.score).toBe(12);
    expect(grade.maxScore).toBe(20);
    expect(grade.items).toEqual([
      { correct: false, pointsEarned: 0 },
      { correct: true, pointsEarned: 12 },
    ]);
    expect(grade.questions[0].correct_option_indices).toEqual([1]);
    expect(grade.questions[0].explanation).toBe("Parce que");
  });

  it("formatScore et appréciation", () => {
    expect(formatScore(13.5, 20)).toBe("13,5 / 20");
    expect(scoreAppreciation(20, 20)).toBe("Parfait ! 🎉");
    expect(scoreAppreciation(14, 20)).toBe("Bon résultat ! 👏");
    expect(scoreAppreciation(5, 20)).toBe("Continue à réviser 💪");
    expect(scoreAppreciation(0, 0)).toBe("Continue à réviser 💪");
  });
});
