"use client";

import { useState, useCallback, useMemo } from "react";
import type { QuizQuestion, QuizPhase, QuizUserAnswer } from "../course.types";

export interface UseQuizFlowReturn {
  phase: QuizPhase;
  currentIndex: number;
  answers: QuizUserAnswer[];
  score: number;
  totalPoints: number;
  total: number;
  start: () => void;
  answer: (indices: number[]) => void;
  next: () => void;
  restart: () => void;
  /** Arrête le quiz en cours (anti-triche : sortie du plein écran, changement d'onglet, perte de focus). No-op si le quiz n'est pas actif. */
  abort: (reason: string) => void;
  /** Raison de l'arrêt (phase `"aborted"`), sinon `null`. */
  abortReason: string | null;
  isActive: boolean;
}

/**
 * Machine à états pour le flux QCM : intro → in_progress → results (ou aborted, si le quiz est
 * interrompu — anti-triche plein écran, voir useFullscreenAntiCheat).
 * Gère la phase, l'index courant, les réponses et le score.
 */
export function useQuizFlow(questions: QuizQuestion[]): UseQuizFlowReturn {
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizUserAnswer[]>([]);
  const [abortReason, setAbortReason] = useState<string | null>(null);

  const total = questions.length;

  const start = useCallback(() => {
    setPhase("in_progress");
    setCurrentIndex(0);
    setAnswers([]);
  }, []);

  const answer = useCallback(
    (indices: number[]) => {
      if (phase !== "in_progress") return;

      setAnswers((prev) => {
        const existing = prev.findIndex((a) => a.questionIndex === currentIndex);
        const newAnswer: QuizUserAnswer = {
          questionIndex: currentIndex,
          selectedOptionIndices: indices,
        };

        if (existing >= 0) {
          const next = [...prev];
          next[existing] = newAnswer;
          return next;
        }
        return [...prev, newAnswer];
      });
    },
    [phase, currentIndex],
  );

  const next = useCallback(() => {
    if (phase !== "in_progress") return;

    if (currentIndex >= total - 1) {
      setPhase("results");
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [phase, currentIndex, total]);

  const restart = useCallback(() => {
    setPhase("intro");
    setCurrentIndex(0);
    setAnswers([]);
    setAbortReason(null);
  }, []);

  /** Idempotent : n'a d'effet que si le quiz est en cours (un 2e événement de triche est un no-op). */
  const abort = useCallback((reason: string) => {
    setPhase((p) => (p === "in_progress" ? "aborted" : p));
    setAbortReason(reason);
  }, []);

  // Score = nombre de questions correctes
  const score = useMemo(() => {
    return answers.filter((a) => {
      const question = questions[a.questionIndex];
      if (!question) return false;
      const correctIndices = question.correct_option_indices ?? [];
      const selected = a.selectedOptionIndices;
      return (
        selected.length === correctIndices.length &&
        selected.every((i) => correctIndices.includes(i))
      );
    }).length;
  }, [answers, questions]);

  // Total des points possibles (somme des points de chaque question)
  const totalPoints = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.points ?? 1), 0);
  }, [questions]);

  const isActive = phase === "in_progress";

  return {
    phase,
    currentIndex,
    answers,
    score,
    totalPoints,
    total,
    start,
    answer,
    next,
    restart,
    abort,
    abortReason,
    isActive,
  };
}
