"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toastError, toastWarning } from "@/shared/ui/toast";
import type { QuizQuestion, QuizPhase, QuizUserAnswer } from "../course.types";
import { startQuizAttempt, submitQuizAttempt } from "../quizAttempt.api";
import type { QuizAttemptSubmitRequest } from "../quizAttempt.schema";
import { gradeFromServer, gradeLocally, toSubmittedAnswers, upsertAnswer, type QuizGrade } from "../quizAttempt";

export interface UseQuizFlowReturn {
  phase: QuizPhase;
  /** Questions de la tentative en cours (série tirée par le serveur, ou questions du cours en repli). */
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizUserAnswer[];
  /** Note de la tentative terminée ; `null` tant que la correction n'est pas disponible. */
  grade: QuizGrade | null;
  /** Création de la tentative en cours (tirage de la série). */
  isStarting: boolean;
  /** Correction serveur en cours. */
  isGrading: boolean;
  /** Erreur de la correction serveur (`retryGrading` la relance), sinon `null`. */
  gradingError: Error | null;
  total: number;
  /** Démarre une nouvelle tentative (nouvelle série) : « Commencer » et « Recommencer ». */
  start: () => void;
  /** Enregistre la réponse à la question courante et passe à la suivante (ou aux résultats). */
  submitAnswer: (indices: number[]) => void;
  retryGrading: () => void;
  /** Revient à l'intro (« Retour au cours »). */
  reset: () => void;
  /** Arrête le quiz en cours (anti-triche). No-op si le quiz n'est pas actif. */
  abort: (reason: string) => void;
  /** Raison de l'arrêt (phase `"aborted"`), sinon `null`. */
  abortReason: string | null;
  isActive: boolean;
}

interface Attempt {
  id: string;
  questions: QuizQuestion[];
}

interface SubmitVariables {
  attempt: Attempt;
  payload: QuizAttemptSubmitRequest;
}

const FALLBACK_WARNING = "Quiz lancé avec les questions du cours : cette tentative ne sera pas enregistrée.";

/**
 * Machine à états du QCM : intro → in_progress → results (ou aborted, anti-triche).
 * Avec une session persistée, chaque départ crée une tentative côté serveur (nouvelle série) et la
 * note /20 est calculée par le serveur à la soumission ; une interruption est enregistrée sans note.
 * Repli : sans session ou si la tentative ne peut être créée, les questions du cours sont utilisées,
 * notées localement, et rien n'est enregistré.
 */
export function useQuizFlow(courseQuestions: QuizQuestion[], sessionId: string | null): UseQuizFlowReturn {
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizUserAnswer[]>([]);
  const [abortReason, setAbortReason] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [localGrade, setLocalGrade] = useState<QuizGrade | null>(null);
  // Une tentative n'est soumise qu'une fois (deux événements de triche peuvent survenir dans le même tick)
  const submittedRef = useRef(false);

  const questions = attempt?.questions ?? courseQuestions;
  const total = questions.length;

  const { mutate: startAttempt, isPending: isStarting } = useMutation({
    mutationFn: (sid: string) => startQuizAttempt(sid),
  });
  const submitMutation = useMutation({
    mutationFn: ({ attempt: target, payload }: SubmitVariables) =>
      submitQuizAttempt(sessionId as string, target.id, payload),
  });
  const { mutate: submit, reset: resetSubmit } = submitMutation;

  const begin = useCallback(
    (next: Attempt | null) => {
      submittedRef.current = false;
      resetSubmit();
      setAttempt(next);
      setLocalGrade(null);
      setAnswers([]);
      setCurrentIndex(0);
      setAbortReason(null);
      setPhase("in_progress");
    },
    [resetSubmit],
  );

  const start = useCallback(() => {
    if (!sessionId) {
      begin(null);
      return;
    }
    startAttempt(sessionId, {
      onSuccess: ({ attempt_id, questions: drawn }) => begin({ id: attempt_id, questions: drawn }),
      onError: () => {
        toastWarning(FALLBACK_WARNING);
        begin(null);
      },
    });
  }, [sessionId, startAttempt, begin]);

  const gradeAttempt = useCallback(
    (finalAnswers: QuizUserAnswer[]) => {
      if (!attempt) {
        setLocalGrade(gradeLocally(courseQuestions, finalAnswers));
        return;
      }
      submit({ attempt, payload: { answers: toSubmittedAnswers(attempt.questions.length, finalAnswers) } });
    },
    [attempt, courseQuestions, submit],
  );

  const submitAnswer = useCallback(
    (indices: number[]) => {
      if (phase !== "in_progress") return;
      const nextAnswers = upsertAnswer(answers, currentIndex, indices);
      setAnswers(nextAnswers);
      if (currentIndex < total - 1) {
        setCurrentIndex(currentIndex + 1);
        return;
      }
      if (submittedRef.current) return;
      submittedRef.current = true;
      setPhase("results");
      gradeAttempt(nextAnswers);
    },
    [phase, answers, currentIndex, total, gradeAttempt],
  );

  const retryGrading = useCallback(() => gradeAttempt(answers), [gradeAttempt, answers]);

  const abort = useCallback(
    (reason: string) => {
      if (phase !== "in_progress" || submittedRef.current) return;
      submittedRef.current = true;
      setPhase("aborted");
      setAbortReason(reason);
      if (!attempt) return;
      const payload = {
        answers: toSubmittedAnswers(attempt.questions.length, answers),
        aborted: true,
        abort_reason: reason,
      };
      submit({ attempt, payload }, { onError: (err) => toastError(err) });
    },
    [phase, attempt, answers, submit],
  );

  const reset = useCallback(() => {
    resetSubmit();
    setPhase("intro");
    setCurrentIndex(0);
    setAnswers([]);
    setAbortReason(null);
    setLocalGrade(null);
  }, [resetSubmit]);

  const serverGrade =
    attempt && submitMutation.data?.status === "completed" ? gradeFromServer(attempt.questions, submitMutation.data) : null;

  return {
    phase,
    questions,
    currentIndex,
    answers,
    grade: localGrade ?? serverGrade,
    isStarting,
    isGrading: phase === "results" && submitMutation.isPending,
    gradingError: phase === "results" ? submitMutation.error : null,
    total,
    start,
    submitAnswer,
    retryGrading,
    reset,
    abort,
    abortReason,
    isActive: phase === "in_progress",
  };
}
