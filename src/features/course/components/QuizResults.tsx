"use client";

import { LatexText } from "@/shared/utils/latex";
import type { QuizQuestion, QuizUserAnswer } from "../course.types";
import { formatSectionRefs } from "../quizSections";

interface QuizResultsProps {
  questions: QuizQuestion[];
  answers: QuizUserAnswer[];
  score: number;
  totalPoints: number;
  onRestart: () => void;
}

/**
 * Écran de résultats du quiz : score global et détail par question.
 */
export function QuizResults({ questions, answers, score, totalPoints, onRestart }: QuizResultsProps) {
  const total = questions.length;

  return (
    <section className="space-y-6" aria-labelledby="quiz-results-heading">
      {/* Score global */}
      <div className="rounded-lg border border-gray-200 p-6 text-center">
        <h3 id="quiz-results-heading" className="text-lg font-semibold text-gray-900 mb-2">
          Résultats du quiz
        </h3>
        <p className="text-3xl font-bold text-indigo-600" aria-live="polite">
          {score} / {total}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {totalPoints > 0 && (
            <span className="block mb-1">
              Points : {score} / {totalPoints}
            </span>
          )}
          {score === total
            ? "Parfait ! 🎉"
            : score >= total * 0.7
              ? "Bon résultat ! 👏"
              : "Continue à réviser 💪"}
        </p>
      </div>

      {/* Détail par question */}
      <div className="space-y-4">
        {questions.map((question, qIdx) => {
          const answer = answers.find((a) => a.questionIndex === qIdx);
          const userIndices = answer?.selectedOptionIndices ?? [];
          const correctIndices = question.correct_option_indices ?? [];
          const isCorrect =
            userIndices.length === correctIndices.length &&
            userIndices.every((i) => correctIndices.includes(i));

          return (
            <div
              key={qIdx}
              className={[
                "rounded-lg border p-4",
                isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50",
              ].join(" ")}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-lg">{isCorrect ? "✓" : "✗"}</span>
                <h4 className="text-sm font-semibold text-gray-900 flex-1">
                  <span className="text-indigo-600 mr-1">Q{qIdx + 1}.</span>
                  <LatexText text={question.question} />
                </h4>
              </div>

              <div className="space-y-2 ml-8">
                {question.options.map((option, optIdx) => {
                  const isUserChoice = userIndices.includes(optIdx);
                  const isCorrectOption = correctIndices.includes(optIdx);

                  let ringClass = "";
                  if (isCorrectOption) {
                    ringClass = "ring-2 ring-green-500 bg-green-50";
                  } else if (isUserChoice) {
                    ringClass = "ring-2 ring-red-500 bg-red-50";
                  }

                  return (
                    <div
                      key={optIdx}
                      className={[
                        "flex items-center gap-3 rounded-lg border p-3 text-sm",
                        ringClass,
                      ].join(" ")}
                    >
                      <span className="flex-1 text-gray-700">
                        <LatexText text={option} autoMath />
                      </span>
                      {isCorrectOption && (
                        <span className="text-green-600 font-medium text-xs">✓ Correct</span>
                      )}
                      {isUserChoice && !isCorrectOption && (
                        <span className="text-red-600 font-medium text-xs">✗ Ta réponse</span>
                      )}
                    </div>
                  );
                })}

                {question.explanation && (
                  <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-100">
                    💡 <LatexText text={question.explanation} />
                  </p>
                )}

                {formatSectionRefs(question.section_refs) && (
                  <p className="text-xs text-gray-500">{formatSectionRefs(question.section_refs)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Retour au cours
        </button>
      </div>
    </section>
  );
}
