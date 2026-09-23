"use client";

import { useMutation } from "@tanstack/react-query";
import { regenerateSection } from "../course.api";
import { toastError } from "@/shared/ui/toast";

interface RegenerateVariables {
  sessionId: string;
  sectionId: string;
}

/** Régénère le contenu d'une section incomplète ; l'erreur (409, 429, 502…) est signalée par un toast. */
export function useRegenerateSection() {
  return useMutation({
    mutationFn: ({ sessionId, sectionId }: RegenerateVariables) => regenerateSection(sessionId, sectionId),
    onError: toastError,
  });
}
