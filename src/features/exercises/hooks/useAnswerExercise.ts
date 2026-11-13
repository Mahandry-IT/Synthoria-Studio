"use client";

import { useMutation } from "@tanstack/react-query";
import { answerExercise } from "../exercise.api";
import { clearDraft } from "../exerciseAnswer";

/** Correction d'une réponse ; le brouillon est effacé au succès, même si l'exercice est démonté entre-temps. L'erreur est affichée dans l'exercice (réponse conservée, « Renvoyer »), sans toast. */
export function useAnswerExercise(sessionId: string, exerciseId: string) {
  return useMutation({
    mutationFn: (answer: string) => answerExercise(sessionId, exerciseId, answer),
    retry: false,
    onSuccess: () => clearDraft(sessionId, exerciseId),
  });
}
