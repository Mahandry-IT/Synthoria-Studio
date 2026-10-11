"use client";

import { useMutation } from "@tanstack/react-query";
import { regenerateSection } from "../course.api";
import type { CourseSection } from "../course.types";
import { toastError } from "@/shared/ui/toast";

interface RegenerateVariables {
  sessionId: string;
  sectionId: string;
}

/**
 * Régénère le contenu d'une section incomplète. L'erreur (409, 429, 502…) est signalée par un toast
 * (sur un 429 : `detail` du backend et compte à rebours `Retry-After`) avec un bouton « Réessayer ».
 * @param onRegenerated - appelé avec la section régénérée, y compris après un « Réessayer » du toast
 */
export function useRegenerateSection(onRegenerated: (section: CourseSection) => void) {
  const mutation = useMutation({
    mutationFn: ({ sessionId, sectionId }: RegenerateVariables) => regenerateSection(sessionId, sectionId),
    onSuccess: onRegenerated,
    onError: (err, variables) => toastError(err, { onRetry: () => mutation.mutate(variables) }),
  });
  return mutation;
}
