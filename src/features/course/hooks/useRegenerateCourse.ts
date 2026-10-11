"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { regenerateCourse } from "../course.api";
import type { CourseGenerationResponse } from "../course.types";
import { toastError, toastSuccess } from "@/shared/ui/toast";

/**
 * Régénère en entier un cours incomplet, remplacé en place côté serveur (même session). Le cours
 * obtenu est transmis à `onRegenerated` ; l'historique est invalidé pour ne plus servir l'ancien.
 * L'erreur (409, 429, 502/503…) est signalée par un toast avec « Réessayer » : rien n'a alors été
 * modifié côté serveur.
 */
export function useRegenerateCourse(onRegenerated: (course: CourseGenerationResponse) => void) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (sessionId: string) => regenerateCourse(sessionId),
    onSuccess: (course) => {
      onRegenerated(course);
      toastSuccess("Cours régénéré.");
      queryClient.invalidateQueries({ queryKey: ["course-history"] });
    },
    onError: (err, sessionId) => toastError(err, { onRetry: () => mutation.mutate(sessionId) }),
  });
  return mutation;
}
