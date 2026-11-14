"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/Button";
import type { QuizQuestion } from "../course.types";

interface QuizIntroProps {
  questions: QuizQuestion[];
  onStart: () => void;
  /** Tirage de la série en cours côté serveur. */
  starting?: boolean;
}

/**
 * Écran d'intro du quiz : affiche le nombre de questions, les points et un bouton "Commencer".
 */
export function QuizIntro({ questions, onStart, starting = false }: QuizIntroProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  const questionCount = questions.length;
  const totalPoints = questions.reduce((sum, q) => sum + (q.points ?? 1), 0);

  return (
    <section
      className="rounded-card border border-line bg-surface p-6 text-center text-ink shadow-paper"
      aria-labelledby="quiz-intro-heading"
    >
      <h3 id="quiz-intro-heading" className="mb-2 font-serif text-xl font-medium">
        Quiz
      </h3>
      <p className="mb-1 text-sm text-ink-2" aria-live="polite">
        {questionCount} question{questionCount > 1 ? "s" : ""}
        {totalPoints > 0 && (
          <span className="ml-2 font-medium text-primary">
            • {totalPoints} point{totalPoints > 1 ? "s" : ""}
          </span>
        )}
      </p>
      <p className="mb-4 text-sm text-ink-3">
        Une question à la fois — le feedback apparaîtra à la fin.
      </p>
      <Button ref={buttonRef} type="button" onClick={onStart} disabled={starting} aria-busy={starting}>
        {starting ? "Préparation du quiz…" : "Commencer"}
      </Button>
    </section>
  );
}
