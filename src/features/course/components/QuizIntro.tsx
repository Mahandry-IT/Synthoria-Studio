"use client";

import { useRef, useEffect } from "react";

interface QuizIntroProps {
  questionCount: number;
  onStart: () => void;
}

/**
 * Écran d'intro du quiz : affiche le nombre de questions et un bouton "Commencer".
 */
export function QuizIntro({ questionCount, onStart }: QuizIntroProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

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
