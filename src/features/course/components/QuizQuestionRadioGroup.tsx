"use client";

import { useState, useCallback, useEffect } from "react";
import type { QuizQuestion } from "../course.types";

interface QuizQuestionRadioGroupProps {
  question: QuizQuestion;
  /** Index de la question dans le quiz (pour l'affichage) */
  index: number;
}

/**
 * Groupe radio pour une question QCM à choix unique.
 * - Choix unique (radio), JAMAIS checkbox (`correct_option_index` est un entier)
 * - Timer fourni par le backend (`time_limit_seconds`)
 * - Feedback correct/incorrect après sélection
 */
export function QuizQuestionRadioGroup({ question, index }: QuizQuestionRadioGroupProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    question.time_limit_seconds ?? null,
  );
  const [expired, setExpired] = useState(false);

  const isRevealed = selected !== null || expired;

  // Timer countdown
  useEffect(() => {
    if (timeLeft == null || timeLeft <= 0 || isRevealed) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev == null || prev <= 1) {
          clearInterval(timer);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isRevealed]);

  const handleChange = useCallback(
    (optionIndex: number) => {
      if (isRevealed) return;
      setSelected(optionIndex);
    },
    [isRevealed],
  );

  const isCorrect = selected === question.correct_option_index;

  return (
    <fieldset className="rounded-lg border border-gray-200 p-4" disabled={isRevealed}>
      <legend className="sr-only">Question {index + 1}</legend>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          <span className="text-indigo-600 mr-1">Q{index + 1}.</span>
          {question.question}
        </h3>
        {timeLeft != null && !isRevealed && (
          <span className="flex-shrink-0 text-xs font-mono text-gray-500">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {question.options.map((option, optIdx) => {
          let ringClass = "";
          if (isRevealed) {
            if (optIdx === question.correct_option_index) {
              ringClass = "ring-2 ring-green-500 bg-green-50";
            } else if (optIdx === selected && !isCorrect) {
              ringClass = "ring-2 ring-red-500 bg-red-50";
            }
          }

          return (
            <label
              key={optIdx}
              className={[
                "flex items-center gap-3 rounded-lg border p-3 text-sm cursor-pointer transition-colors",
                isRevealed && "cursor-default",
                !isRevealed && "hover:bg-gray-50",
                ringClass,
              ].join(" ")}
            >
              <input
                type="radio"
                name={`quiz-q-${index}`}
                value={optIdx}
                checked={selected === optIdx}
                onChange={() => handleChange(optIdx)}
                disabled={isRevealed}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex-1 text-gray-700">{option}</span>
              {isRevealed && optIdx === question.correct_option_index && (
                <span className="text-green-600 font-medium text-xs">✓ Correct</span>
              )}
              {isRevealed && optIdx === selected && !isCorrect && (
                <span className="text-red-600 font-medium text-xs">✗ Incorrect</span>
              )}
            </label>
          );
        })}
      </div>

      {isRevealed && (
        <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          💡 {question.explanation}
        </p>
      )}
    </fieldset>
  );
}
