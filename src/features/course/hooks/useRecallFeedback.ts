"use client";

import { useMutation } from "@tanstack/react-query";
import { evaluateRecall } from "../course.api";
import { toastError } from "@/shared/ui/toast";

interface RecallVariables {
  sessionId: string;
  sectionId: string;
  answer: string;
}

/** Évaluation IA de la reformulation d'une section ; l'erreur (429, 502…) est signalée par un toast. */
export function useRecallFeedback() {
  return useMutation({
    mutationFn: ({ sessionId, sectionId, answer }: RecallVariables) => evaluateRecall(sessionId, sectionId, answer),
    onError: toastError,
  });
}
