"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { LatexText } from "@/shared/utils/latex";
import { CircularTimer } from "./CircularTimer";
import type { QuizQuestion } from "../course.types";

interface QuizQuestionStepProps {
  question: QuizQuestion;
  index: number;
  total: number;
  onNext: (selectedIndices: number[]) => void;
  isActive: boolean;
}

/** Badge de difficulté */
function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    facile: "bg-green-100 text-green-700",
    normale: "bg-yellow-100 text-yellow-700",
    difficile: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    facile: "Facile",
    normale: "Normale",
    difficile: "Difficile",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[difficulty] ?? ""}`}>
      {labels[difficulty] ?? difficulty}
    </span>
  );
}

/**
 * Affiche une seule question QCM avec sélection multiple (checkboxes).
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
  const [selected, setSelected] = useState<Set<number>>(new Set());
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

  // Timer countdown — reset à chaque nouvelle question
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
      onNext([]);
    }
  });

  // Reset state quand la question change
  useEffect(() => {
    setSelected(new Set());
    setTimeLeft(question.time_limit_seconds ?? null);
    expiredRef.current = false;
  }, [question, index]);

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

  const handleNext = useCallback(() => {
    onNext(Array.from(selected));
  }, [onNext, selected]);

  return (
    <fieldset
      ref={fieldsetRef}
      tabIndex={-1}
      className="rounded-lg border border-gray-200 p-4 focus:outline-none"
    >
      <legend className="sr-only">Question {index + 1} sur {total}</legend>

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900">
              <span className="text-indigo-600 mr-1">Q{index + 1}.</span>
              <LatexText text={question.question} />
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {question.difficulty && (
              <DifficultyBadge difficulty={question.difficulty} />
            )}
            {question.points != null && question.points > 0 && (
              <span className="text-xs text-gray-500">
                {question.points} pt{question.points > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        {timeLeft != null && isActive && (
          <CircularTimer timeLeft={timeLeft} totalTime={totalTime} />
        )}
      </div>

      <div className="space-y-2">
        {question.options.map((option, optIdx) => {
          const isSelected = selected.has(optIdx);

          return (
            <label
              key={optIdx}
              className={[
                "flex items-center gap-3 rounded-lg border p-3 text-sm cursor-pointer transition-colors",
                !isSelected && "hover:bg-gray-50",
                isSelected && "bg-indigo-50 border-indigo-300",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleChange(optIdx)}
                disabled={!isActive}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex-1 text-gray-700">
                <LatexText text={option} autoMath />
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          disabled={selected.size === 0}
          className={[
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            selected.size > 0
              ? "bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              : "bg-gray-100 text-gray-400 cursor-not-allowed",
          ].join(" ")}
        >
          {isLastQuestion ? "Voir les résultats" : "Suivant"}
        </button>
      </div>
    </fieldset>
  );
}
