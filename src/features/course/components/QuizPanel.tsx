"use client";

import type { QuizQuestion } from "../course.types";
import type { UseQuizFlowReturn } from "../hooks/useQuizFlow";
import { QuizIntro } from "./QuizIntro";
import { QuizQuestionStep } from "./QuizQuestionStep";
import { QuizResults } from "./QuizResults";

interface QuizPanelProps {
  questions: QuizQuestion[];
  /** État du quiz, porté par le parent pour qu'il puisse masquer le cours pendant le quiz. */
  flow: UseQuizFlowReturn;
}

/**
 * Panel QCM : affiche l'écran correspondant à la phase intro → in_progress → results.
 * Seule l'intro est destinée à s'afficher dans la page du cours ; les autres phases
 * occupent une page dédiée (voir CourseView).
 */
export function QuizPanel({ questions, flow }: QuizPanelProps) {
  const { phase, currentIndex, answers, score, totalPoints, total, start, answer, next, restart, isActive } = flow;

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
