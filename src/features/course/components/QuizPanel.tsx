"use client";

import { useEffect } from "react";
import type { QuizQuestion } from "../course.types";
import type { UseQuizFlowReturn } from "../hooks/useQuizFlow";
import { useFullscreenAntiCheat } from "../hooks/useFullscreenAntiCheat";
import { QuizAborted } from "./QuizAborted";
import { QuizIntro } from "./QuizIntro";
import { QuizQuestionStep } from "./QuizQuestionStep";
import { QuizResults } from "./QuizResults";

interface QuizPanelProps {
  questions: QuizQuestion[];
  /** État du quiz, porté par le parent pour qu'il puisse masquer le cours pendant le quiz. */
  flow: UseQuizFlowReturn;
}

/**
 * Panel QCM : affiche l'écran correspondant à la phase intro → in_progress → results/aborted.
 * Seule l'intro est destinée à s'afficher dans la page du cours ; les autres phases occupent tout
 * le viewport (voir CourseView) en plein écran natif, avec arrêt anti-triche immédiat si l'onglet,
 * le focus ou le plein écran sont quittés pendant le quiz (useFullscreenAntiCheat).
 */
export function QuizPanel({ questions, flow }: QuizPanelProps) {
  const { phase, currentIndex, answers, score, totalPoints, total, start, answer, next, restart, abort, abortReason, isActive } = flow;

  useFullscreenAntiCheat(isActive, abort);

  // Sort systématiquement du plein écran dès que le quiz n'est plus en cours, quelle qu'en soit la
  // raison (fin normale, arrêt anti-triche) — et au démontage si le composant disparaît en pleine partie.
  useEffect(() => {
    if (phase !== "in_progress" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [phase]);
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  if (questions.length === 0) return null;

  const handleStart = () => {
    start();
    // Doit être appelé de façon synchrone dans le geste utilisateur (exigence des navigateurs) ;
    // un refus (permission, iframe restreinte...) laisse le quiz démarrer en mode dégradé, sans
    // plein écran — la détection onglet/focus reste active dans tous les cas.
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const fullscreenPhase = phase === "in_progress" || phase === "results" || phase === "aborted";

  const content = (
    <>
      {phase === "intro" && (
        <QuizIntro questions={questions} onStart={handleStart} />
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

      {phase === "aborted" && <QuizAborted reason={abortReason} onRestart={restart} />}
    </>
  );

  if (fullscreenPhase) {
    return (
      <div className="fixed inset-0 z-60 overflow-y-auto bg-white">
        <div className="mx-auto max-w-3xl p-6">
          <h2 id="quiz-heading" className="text-lg font-semibold text-gray-900 mb-4">
            Quiz
          </h2>
          {content}
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="quiz-heading">
      <h2 id="quiz-heading" className="text-lg font-semibold text-gray-900 mb-4">
        Quiz
      </h2>
      {content}
    </section>
  );
}
