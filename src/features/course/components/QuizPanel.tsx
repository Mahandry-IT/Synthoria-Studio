"use client";

import { QuizQuestionRadioGroup } from "./QuizQuestionRadioGroup";
import type { QuizQuestion } from "../course.types";

interface QuizPanelProps {
  questions: QuizQuestion[];
}

/**
 * Panel QCM regroupant toutes les questions.
 * ⚠️ Affiché si `quiz` non null et non vide.
 * Choix unique (radio) uniquement.
 */
export function QuizPanel({ questions }: QuizPanelProps) {
  if (questions.length === 0) return null;

  return (
    <section aria-labelledby="quiz-heading">
      <h2 id="quiz-heading" className="text-lg font-semibold text-gray-900 mb-4">
        Quiz
      </h2>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuizQuestionRadioGroup key={i} question={q} index={i} />
        ))}
      </div>
    </section>
  );
}
