"use client";

import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { ProgressBar } from "@/components/ProgressBar";
import { Skeleton } from "@/components/Skeleton";
import { LatexText } from "@/shared/utils/latex";
import type { QuizQuestion, QuizUserAnswer } from "../course.types";
import { formatScore, scoreAppreciation, type QuizGrade, type QuizGradeItem } from "../quizAttempt";
import { questionKind } from "../quizGrading";
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

/**
 * Écran de résultats du quiz : note /20 (calculée par le serveur pour une tentative enregistrée)
 * et détail par question (bonne réponse, explication, points obtenus).
 */
export function QuizResults({ grade, answers, grading, gradingError, onRetryGrading, onRestart, onBack }: QuizResultsProps) {
  return (
    <section className="space-y-6" aria-labelledby="quiz-results-heading" aria-busy={grading}>
      <div className="rounded-card border border-line bg-surface p-6 text-center text-ink shadow-paper">
        <h3 id="quiz-results-heading" className="mb-2 font-serif text-xl font-medium">
          Résultats du quiz
        </h3>
        {grading && (
          <>
            <p className="text-sm text-ink-3" role="status">
              Correction en cours…
            </p>
            <Skeleton lines={2} />
          </>
        )}
        {grade && (
          <>
            <p className="font-serif text-4xl font-semibold text-primary" aria-live="polite">
              {formatScore(grade.score, grade.maxScore)}
            </p>
            <p className="mt-1 text-sm text-ink-2">{scoreAppreciation(grade.score, grade.maxScore)}</p>
            {grade.maxScore > 0 && (
              <ProgressBar value={grade.score} max={grade.maxScore} label="Score du quiz" className="mx-auto mt-4 max-w-xs" />
            )}
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
              answer={answers.find((a) => a.questionIndex === qIdx)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>
          Retour au cours
        </Button>
        <Button type="button" onClick={onRestart} disabled={grading}>
          Recommencer
        </Button>
      </div>
    </section>
  );
}

const pointsFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

interface QuestionResultProps {
  question: QuizQuestion;
  index: number;
  item: QuizGradeItem | undefined;
  answer: QuizUserAnswer | undefined;
}

function QuestionResult({ question, index, item, answer }: QuestionResultProps) {
  const isCorrect = item?.correct ?? false;
  const sectionRefs = formatSectionRefs(question.section_refs);

  return (
    <div
      className={[
        "rounded-card border p-4 text-ink",
        isCorrect ? "border-ok bg-ok-soft" : "border-err bg-err-soft",
      ].join(" ")}
    >
      <div className="mb-3 flex items-start gap-3">
        <span className={`text-lg font-semibold ${isCorrect ? "text-ok" : "text-err"}`} aria-hidden="true">
          {isCorrect ? "✓" : "✗"}
        </span>
        <h4 className="flex-1 font-serif text-base font-medium leading-snug">
          <span className="mr-1.5 font-mono text-sm text-primary">Q{index + 1}.</span>
          <span className="sr-only">{isCorrect ? "Réponse juste." : "Réponse fausse."}</span>
          <LatexText text={question.question} />
        </h4>
        {item && (
          <span className="shrink-0 font-mono text-xs font-medium tabular-nums text-ink-2">
            {pointsFormat.format(item.pointsEarned)} / {pointsFormat.format(question.points)} pt
          </span>
        )}
      </div>

      <div className="ml-8 space-y-2">
        <QuestionCorrection question={question} answer={answer} />

        {question.explanation && (
          <p className="rounded-ctrl border border-line bg-surface p-3 text-sm text-ink-2">
            💡 <LatexText text={question.explanation} />
          </p>
        )}

        {sectionRefs && <p className="text-xs text-ink-2">{sectionRefs}</p>}
      </div>
    </div>
  );
}

const valueFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 6 });

function formatValue(value: number | null | undefined, unit: string | null | undefined): string {
  if (value == null) return "—";
  return unit ? `${valueFormat.format(value)} ${unit}` : valueFormat.format(value);
}

/** Correction détaillée d'une question, selon son format. */
function QuestionCorrection({ question, answer }: { question: QuizQuestion; answer: QuizUserAnswer | undefined }) {
  const kind = questionKind(question);

  if (kind === "numeric") {
    return (
      <dl className="space-y-1 text-sm text-ink">
        <div className="flex gap-2">
          <dt className="font-medium">Ta réponse :</dt>
          <dd>{answer?.numericValue != null ? formatValue(answer.numericValue, question.unit) : "Aucune réponse"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-ok">✓ Bonne valeur :</dt>
          <dd>{formatValue(question.expected_value, question.unit)}</dd>
        </div>
      </dl>
    );
  }

  if (kind === "matching") {
    const expected = question.correct_matches ?? [];
    return (
      <ul className="space-y-2">
        {(question.subjects ?? []).map((subject, i) => {
          const given = answer?.matches?.[i] ?? null;
          const ok = given != null && given === expected[i];
          return (
            <li key={i} className="rounded-ctrl border border-line bg-surface p-3 text-sm">
              <p className="text-ink">
                <LatexText text={subject} autoMath />
              </p>
              <p className="text-ok">
                <span className="font-medium">✓ Attendu :</span> {question.options[expected[i]] ?? "—"}
              </p>
              <p className={ok ? "text-ok" : "text-err"}>
                <span className="font-medium">{ok ? "✓" : "✗"} Ta réponse :</span> {given != null ? (question.options[given] ?? "—") : "Aucune réponse"}
              </p>
            </li>
          );
        })}
      </ul>
    );
  }

  const selected = answer?.selectedOptionIndices ?? [];
  const correctIndices = question.correct_option_indices ?? [];
  return (
    <div className="space-y-2">
      {question.options.map((option, optIdx) => {
        const isUserChoice = selected.includes(optIdx);
        const isCorrectOption = correctIndices.includes(optIdx);
        const toneClass = isCorrectOption
          ? "border-ok bg-ok-soft"
          : isUserChoice
            ? "border-err bg-err-soft"
            : "border-line bg-surface";

        return (
          <div key={optIdx} className={["flex items-center gap-3 rounded-ctrl border p-3 text-sm", toneClass].join(" ")}>
            <span className="flex-1 text-ink">
              <LatexText text={option} autoMath />
            </span>
            {isCorrectOption && <span className="text-xs font-medium text-ok">✓ Correct</span>}
            {isUserChoice && !isCorrectOption && <span className="text-xs font-medium text-err">✗ Ta réponse</span>}
          </div>
        );
      })}
    </div>
  );
}
