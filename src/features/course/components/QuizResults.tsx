"use client";

import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { LatexText } from "@/shared/utils/latex";
import type { QuizQuestion, QuizUserAnswer } from "../course.types";
import { formatScore, scoreAppreciation, type QuizGrade, type QuizGradeItem } from "../quizAttempt";
import { formatSectionRefs } from "../quizSections";

interface QuizResultsProps {
  /** Note de la tentative ; `null` pendant la correction serveur ou après son échec. */
  grade: QuizGrade | null;
  answers: QuizUserAnswer[];
  grading: boolean;
  gradingError: Error | null;
  onRetryGrading: () => void;
  /** Nouvelle tentative (nouvelle série). */
  onRestart: () => void;
  /** Retour au cours (intro du quiz). */
  onBack: () => void;
}

const SECONDARY_BUTTON =
  "inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors";
const PRIMARY_BUTTON =
  "inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors";

/**
 * Écran de résultats du quiz : note /20 (calculée par le serveur pour une tentative enregistrée)
 * et détail par question (bonne réponse, explication, points obtenus).
 */
export function QuizResults({ grade, answers, grading, gradingError, onRetryGrading, onRestart, onBack }: QuizResultsProps) {
  return (
    <section className="space-y-6" aria-labelledby="quiz-results-heading" aria-busy={grading}>
      <div className="rounded-lg border border-gray-200 p-6 text-center">
        <h3 id="quiz-results-heading" className="text-lg font-semibold text-gray-900 mb-2">
          Résultats du quiz
        </h3>
        {grading && (
          <>
            <p className="text-sm text-gray-500" role="status">
              Correction en cours…
            </p>
            <Skeleton lines={2} />
          </>
        )}
        {grade && (
          <>
            <p className="text-3xl font-bold text-indigo-600" aria-live="polite">
              {formatScore(grade.score, grade.maxScore)}
            </p>
            <p className="text-sm text-gray-500 mt-1">{scoreAppreciation(grade.score, grade.maxScore)}</p>
          </>
        )}
      </div>

      {gradingError && !grading && <ErrorState error={gradingError} onRetry={onRetryGrading} />}

      {grade && (
        <div className="space-y-4">
          {grade.questions.map((question, qIdx) => (
            <QuestionResult
              key={qIdx}
              question={question}
              index={qIdx}
              item={grade.items[qIdx]}
              selected={answers.find((a) => a.questionIndex === qIdx)?.selectedOptionIndices ?? []}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onBack} className={SECONDARY_BUTTON}>
          Retour au cours
        </button>
        <button type="button" onClick={onRestart} className={PRIMARY_BUTTON} disabled={grading}>
          Recommencer
        </button>
      </div>
    </section>
  );
}

const pointsFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

interface QuestionResultProps {
  question: QuizQuestion;
  index: number;
  item: QuizGradeItem | undefined;
  selected: number[];
}

function QuestionResult({ question, index, item, selected }: QuestionResultProps) {
  const isCorrect = item?.correct ?? false;
  const correctIndices = question.correct_option_indices ?? [];
  const sectionRefs = formatSectionRefs(question.section_refs);

  return (
    <div className={["rounded-lg border p-4", isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"].join(" ")}>
      <div className="flex items-start gap-3 mb-3">
        <span className="text-lg" aria-hidden="true">
          {isCorrect ? "✓" : "✗"}
        </span>
        <h4 className="text-sm font-semibold text-gray-900 flex-1">
          <span className="text-indigo-600 mr-1">Q{index + 1}.</span>
          <span className="sr-only">{isCorrect ? "Réponse juste." : "Réponse fausse."}</span>
          <LatexText text={question.question} />
        </h4>
        {item && (
          <span className="shrink-0 text-xs font-medium text-gray-600 tabular-nums">
            {pointsFormat.format(item.pointsEarned)} / {pointsFormat.format(question.points)} pt
          </span>
        )}
      </div>

      <div className="space-y-2 ml-8">
        {question.options.map((option, optIdx) => {
          const isUserChoice = selected.includes(optIdx);
          const isCorrectOption = correctIndices.includes(optIdx);
          const ringClass = isCorrectOption
            ? "ring-2 ring-green-500 bg-green-50"
            : isUserChoice
              ? "ring-2 ring-red-500 bg-red-50"
              : "";

          return (
            <div key={optIdx} className={["flex items-center gap-3 rounded-lg border p-3 text-sm", ringClass].join(" ")}>
              <span className="flex-1 text-gray-700">
                <LatexText text={option} autoMath />
              </span>
              {isCorrectOption && <span className="text-green-600 font-medium text-xs">✓ Correct</span>}
              {isUserChoice && !isCorrectOption && <span className="text-red-600 font-medium text-xs">✗ Ta réponse</span>}
            </div>
          );
        })}

        {question.explanation && (
          <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-100">
            💡 <LatexText text={question.explanation} />
          </p>
        )}

        {sectionRefs && <p className="text-xs text-gray-500">{sectionRefs}</p>}
      </div>
    </div>
  );
}
