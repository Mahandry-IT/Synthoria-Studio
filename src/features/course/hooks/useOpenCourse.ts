"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getCourseHistoryById } from "@/features/history/history.api";
import { HttpError } from "@/shared/api/httpClient";
import { toastWarning } from "@/shared/ui/toast";

/**
 * Ouvre la page d'un cours (/history/[id]) après avoir vérifié qu'il existe encore.
 * La vérification remplit le cache de la page : elle s'affiche sans second chargement.
 * Cours introuvable (ou erreur) : simple avertissement, pas de redirection ; `onNotFound` n'est
 * appelé que sur un 404 (cours supprimé), pas sur une erreur réseau passagère.
 */
export function useOpenCourse(onNotFound?: () => void) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      queryClient.fetchQuery({ queryKey: ["course-history", id], queryFn: () => getCourseHistoryById(id) }),
    onSuccess: (_, id) => router.push(`/history/${id}`),
    onError: (err) => {
      toastWarning("Ce cours n'existe pas ou n'est plus disponible.");
      if (err instanceof HttpError && err.status === 404) onNotFound?.();
    },
  });
}
