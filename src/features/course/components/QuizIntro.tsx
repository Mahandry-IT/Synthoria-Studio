"use client";

import { useRef, useEffect } from "react";
import type { QuizQuestion } from "../course.types";

interface QuizIntroProps {
  questions: QuizQuestion[];
  onStart: () => void;
}

/**
 * Écran d'intro du quiz : affiche le nombre de questions, les points et un bouton "Commencer".
 */
export function QuizIntro({ questions, onStart }: QuizIntroProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  const questionCount = questions.length;
  const totalPoints = questions.reduce((sum, q) => sum + (q.points ?? 1), 0);

  return (
    <section
      className="rounded-lg border border-gray-200 p-6 text-center"
      aria-labelledby="quiz-intro-heading"
    >
      <h3 id="quiz-intro-heading" className="text-lg font-semibold text-gray-900 mb-2">
        Quiz
      </h3>
      <p className="text-sm text-gray-600 mb-1" aria-live="polite">
        {questionCount} question{questionCount > 1 ? "s" : ""}
        {totalPoints > 0 && (
          <span className="ml-2 text-indigo-600 font-medium">
            • {totalPoints} point{totalPoints > 1 ? "s" : ""}
          </span>
        )}
      </p>
      <p className="text-sm text-gray-500 mb-4">
        Une question à la fois — le feedback apparaîtra à la fin.
      </p>
      <button
        ref={buttonRef}
        type="button"
        onClick={onStart}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
      >
        Commencer
      </button>
    </section>
  );
}
