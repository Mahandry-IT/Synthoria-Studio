"use client";

import type { QuizQuestion } from "../course.types";
import { useQuizFlow } from "../hooks/useQuizFlow";
import { QuizIntro } from "./QuizIntro";
import { QuizQuestionStep } from "./QuizQuestionStep";
import { QuizResults } from "./QuizResults";

interface QuizPanelProps {
  questions: QuizQuestion[];
}

/**
 * Panel QCM orchestrateur : gère les phases intro → in_progress → results.
 * Interface publique inchangée : `{ questions: QuizQuestion[] }`.
 */
export function QuizPanel({ questions }: QuizPanelProps) {
  const { phase, currentIndex, answers, score, totalPoints, total, start, answer, next, restart, isActive } =
    useQuizFlow(questions);

  if (questions.length === 0) return null;

  return (
    <section aria-labelledby="quiz-heading">
      <h2 id="quiz-heading" className="text-lg font-semibold text-gray-900 mb-4">
        Quiz
      </h2>

      {phase === "intro" && (
        <QuizIntro questions={questions} onStart={start} />
      )}

      {phase === "in_progress" && (
        <QuizQuestionStep
          key={currentIndex}
          question={questions[currentIndex]}
          index={currentIndex}
          total={total}
          onNext={(indices) => {
            answer(indices);
            next();
          }}
          isActive={isActive}
        />
      )}

      {phase === "results" && (
        <QuizResults
          questions={questions}
          answers={answers}
          score={score}
          totalPoints={totalPoints}
          onRestart={restart}
        />
      )}
    </section>
  );
}
