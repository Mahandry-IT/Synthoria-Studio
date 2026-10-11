"use client";

import { useMutation } from "@tanstack/react-query";
import { evaluateChallenge } from "../course.api";
import { toastError } from "@/shared/ui/toast";

interface ChallengeVariables {
  sessionId: string;
  sectionId: string;
  answer: string;
}

/** Analyse IA de la réponse au défi d'une section ; l'erreur (429, 502…) est signalée par un toast. */
export function useChallengeFeedback() {
  return useMutation({
    mutationFn: ({ sessionId, sectionId, answer }: ChallengeVariables) =>
      evaluateChallenge(sessionId, sectionId, answer),
    onError: (err) => toastError(err),
  });
}
