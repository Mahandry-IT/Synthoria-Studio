"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCourse } from "../history.api";
import { toastError, toastSuccess } from "@/shared/ui/toast";

/** Supprime un cours de l'historique ; rafraîchit la liste. */
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: () => {
      toastSuccess("Cours supprimé.");
      queryClient.invalidateQueries({ queryKey: ["course-history"] });
    },
    onError: toastError,
  });
}
