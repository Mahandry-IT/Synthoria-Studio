"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Option } from "@/components/Check";
import { LatexText } from "@/shared/utils/latex";
import { CircularTimer } from "./CircularTimer";
import type { QuizAnswerInput, QuizQuestion } from "../course.types";
import { parseNumericInput, questionKind } from "../quizGrading";
import { QuizQuestionMatching } from "./QuizQuestionMatching";
import { QuizQuestionNumeric } from "./QuizQuestionNumeric";

interface QuizQuestionStepProps {
  question: QuizQuestion;
  index: number;
  total: number;
  onNext: (answer: QuizAnswerInput) => void;
  isActive: boolean;
}

const DIFFICULTY_TONES = { facile: "ok", normale: "warn", difficile: "err" } as const;
const DIFFICULTY_LABELS: Record<string, string> = { facile: "Facile", normale: "Normale", difficile: "Difficile" };

/** Badge de difficulté : le niveau est écrit, la couleur n'est qu'un renfort. */
function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const tone = DIFFICULTY_TONES[difficulty as keyof typeof DIFFICULTY_TONES] ?? "neutral";
  return <Badge variant={tone}>{DIFFICULTY_LABELS[difficulty] ?? difficulty}</Badge>;
}

/**
 * Affiche une seule question : QCM (checkboxes), valeur numérique ou appariement selon `kind`.
 * - Pas de reveal correct/incorrect pendant le quiz
 * - Timer piloté par isActive (démarré uniquement quand la question est active)
 * - Bouton "Suivant" / "Voir les résultats"
 */
export function QuizQuestionStep({
  question,
  index,
  total,
  onNext,
  isActive,
}: QuizQuestionStepProps) {
  const kind = questionKind(question);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [numericText, setNumericText] = useState("");
  const [matches, setMatches] = useState<(number | null)[]>(() => (question.subjects ?? []).map(() => null));
  const totalTime = question.time_limit_seconds ?? 0;
  const [timeLeft, setTimeLeft] = useState<number | null>(
    question.time_limit_seconds ?? null,
  );
  const expiredRef = useRef(false);
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);

  const isLastQuestion = index === total - 1;

  // Focus sur la question à chaque transition
  useEffect(() => {
    fieldsetRef.current?.focus();
  }, [index]);

  // Timer countdown — l'état repart de zéro à chaque question (le parent remonte le composant via `key`)
  useEffect(() => {
    if (!isActive || timeLeft == null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev == null || prev <= 1) {
          clearInterval(timer);
          expiredRef.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  // Gérer l'expiration séparément pour éviter le setState-during-render
  useEffect(() => {
    if (expiredRef.current) {
      expiredRef.current = false;
      onNext({ selectedOptionIndices: [] });
    }
  });

  const handleChange = useCallback((optionIndex: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(optionIndex)) {
        next.delete(optionIndex);
      } else {
        next.add(optionIndex);
      }
      return next;
    });
  }, []);

  const handleMatch = useCallback((subjectIndex: number, optionIndex: number | null) => {
    setMatches((prev) => prev.map((value, i) => (i === subjectIndex ? optionIndex : value)));
  }, []);

  // Numérique et appariement acceptent une réponse vide ; le QCM exige au moins un choix
  const canContinue = kind !== "choice" || selected.size > 0;

  const handleNext = useCallback(() => {
    if (kind === "numeric") onNext({ selectedOptionIndices: [], numericValue: parseNumericInput(numericText) });
    else if (kind === "matching") onNext({ selectedOptionIndices: [], matches });
    else onNext({ selectedOptionIndices: Array.from(selected) });
  }, [kind, onNext, selected, numericText, matches]);

  return (
    <fieldset
      ref={fieldsetRef}
      tabIndex={-1}
      className="rounded-card border border-line bg-surface p-4 focus:outline-none"
    >
      <legend className="sr-only">Question {index + 1} sur {total}</legend>

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="font-serif text-lg font-medium leading-snug text-ink">
              <span className="mr-1.5 font-mono text-base text-primary">Q{index + 1}.</span>
              <LatexText text={question.question} />
            </h3>
          </div>
          <div className="mt-1 flex items-center gap-2">
            {question.difficulty && (
              <DifficultyBadge difficulty={question.difficulty} />
            )}
            {question.points != null && question.points > 0 && (
              <span className="text-xs text-ink-3">
                {question.points} pt{question.points > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        {timeLeft != null && isActive && (
          <CircularTimer timeLeft={timeLeft} totalTime={totalTime} />
        )}
      </div>

      {kind === "numeric" && (
        <QuizQuestionNumeric question={question} value={numericText} onChange={setNumericText} disabled={!isActive} />
      )}

      {kind === "matching" && (
        <QuizQuestionMatching question={question} selections={matches} onChange={handleMatch} disabled={!isActive} />
      )}

      {kind === "choice" && (
        <div className="space-y-2">
          {question.options.map((option, optIdx) => (
            <Option
              key={optIdx}
              type="checkbox"
              checked={selected.has(optIdx)}
              onChange={() => handleChange(optIdx)}
              disabled={!isActive}
              label={<LatexText text={option} autoMath />}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={handleNext} disabled={!canContinue}>
          {isLastQuestion ? "Voir les résultats" : "Suivant"}
        </Button>
      </div>
    </fieldset>
  );
}
