"use client";

import { useMutation } from "@tanstack/react-query";
import { fetchCourseSection, regenerateSection } from "../course.api";
import type { CourseSection } from "../course.types";
import { HttpError } from "@/shared/api/httpClient";
import { toastError, toastSuccess } from "@/shared/ui/toast";

interface RegenerateVariables {
  sessionId: string;
  sectionId: string;
}

/** Section déjà complète côté serveur (régénérée ailleurs) ; null si le refus a une autre cause. */
async function alreadyRegenerated(err: unknown, { sessionId, sectionId }: RegenerateVariables) {
  if (!(err instanceof HttpError) || err.status !== 409) return null;
  try {
    const section = await fetchCourseSection(sessionId, sectionId);
    return section && !section.incomplete ? section : null;
  } catch {
    return null;
  }
}

/**
 * Régénère le contenu d'une section incomplète. L'erreur (409, 429, 502…) est signalée par un toast
 * (sur un 429 : `detail` du backend et compte à rebours `Retry-After`) avec un bouton « Réessayer ».
 *
 * Un 409 peut signifier que la section a déjà été régénérée ailleurs (régénération groupée, autre
 * onglet) alors que l'affichage la montre encore incomplète : dans ce cas la section du serveur est
 * reprise telle quelle, sans erreur.
 * @param onRegenerated - appelé avec la section régénérée, y compris après un « Réessayer » du toast
 */
export function useRegenerateSection(onRegenerated: (section: CourseSection) => void) {
  const mutation = useMutation({
    mutationFn: ({ sessionId, sectionId }: RegenerateVariables) => regenerateSection(sessionId, sectionId),
    onSuccess: onRegenerated,
    onError: async (err, variables) => {
      const current = await alreadyRegenerated(err, variables);
      if (current) {
        onRegenerated(current);
        toastSuccess("Cette section avait déjà été régénérée : affichage mis à jour.");
        return;
      }
      toastError(err, { onRetry: () => mutation.mutate(variables) });
    },
  });
  return mutation;
}
