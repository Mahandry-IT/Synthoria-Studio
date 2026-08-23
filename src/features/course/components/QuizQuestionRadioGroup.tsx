"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { LatexText } from "@/shared/utils/latex";
import { CircularTimer } from "./CircularTimer";
import type { QuizQuestion } from "../course.types";

interface QuizQuestionRadioGroupProps {
  question: QuizQuestion;
  index: number;
}

/**
 * Groupe checkbox pour une question QCM à choix multiples.
 * - Feedback correct/incorrect uniquement APRÈS sélection
 * - Timer fourni par le backend (time_limit_seconds)
 * - Rendu LaTeX dans les options et explications
 */
export function QuizQuestionRadioGroup({ question, index }: QuizQuestionRadioGroupProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const totalTime = question.time_limit_seconds ?? 0;
  const [timeLeft, setTimeLeft] = useState<number | null>(
    question.time_limit_seconds ?? null,
  );
  const expiredRef = useRef(false);
  const [expired, setExpired] = useState(false);

  const isRevealed = selected.size > 0 || expired;

  // Timer countdown — reset si la question change
  useEffect(() => {
    if (timeLeft == null || timeLeft <= 0 || isRevealed) return;

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
  }, [timeLeft, isRevealed]);

  // Gérer l'expiration hors du render
  useEffect(() => {
    if (expiredRef.current) {
      expiredRef.current = false;
      setExpired(true);
    }
  });

  const handleChange = useCallback(
    (optionIndex: number) => {
      if (isRevealed) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(optionIndex)) {
          next.delete(optionIndex);
        } else {
          next.add(optionIndex);
        }
        return next;
      });
    },
    [isRevealed],
  );

  const correctIndices = Array.isArray(question.correct_option_index)
    ? question.correct_option_index
    : [question.correct_option_index];
  const isCorrect =
    selected.size === correctIndices.length &&
    Array.from(selected).every((i) => correctIndices.includes(i));

  return (
    <fieldset className="rounded-lg border border-gray-200 p-4">
      <legend className="sr-only">Question {index + 1}</legend>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          <span className="text-indigo-600 mr-1">Q{index + 1}.</span>
          <LatexText text={question.question} />
        </h3>
        {timeLeft != null && !isRevealed && (
          <CircularTimer timeLeft={timeLeft} totalTime={totalTime} />
        )}
      </div>

      <div className="space-y-2">
        {question.options.map((option, optIdx) => {
          const isSelected = selected.has(optIdx);
          const isCorrectOption = correctIndices.includes(optIdx);

          let ringClass = "";
          if (isRevealed) {
            if (isCorrectOption) {
              ringClass = "ring-2 ring-green-500 bg-green-50";
            } else if (isSelected && !isCorrect) {
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
                type="checkbox"
                checked={isSelected}
                onChange={() => handleChange(optIdx)}
                disabled={isRevealed}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex-1 text-gray-700">
                <LatexText text={option} />
              </span>
              {isRevealed && isCorrectOption && (
                <span className="text-green-600 font-medium text-xs">✓ Correct</span>
              )}
              {isRevealed && isSelected && !isCorrect && (
                <span className="text-red-600 font-medium text-xs">✗ Incorrect</span>
              )}
            </label>
          );
        })}
      </div>

      {isRevealed && question.explanation && (
        <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          💡 <LatexText text={question.explanation} />
        </p>
      )}
    </fieldset>
  );
}
