"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moveCourseToFolder } from "../history.api";
import { toastError, toastSuccess } from "@/shared/ui/toast";

interface MoveCourseArgs {
  sessionId: string;
  folder: string;
  subfolder?: string | null;
}

/** Déplace un cours vers un dossier/sous-dossier ; rafraîchit la liste et l'arborescence. */
export function useMoveCourseToFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, folder, subfolder }: MoveCourseArgs) =>
      moveCourseToFolder(sessionId, { folder, subfolder }),
    onSuccess: () => {
      toastSuccess("Cours déplacé.");
      queryClient.invalidateQueries({ queryKey: ["course-history"] });
      queryClient.invalidateQueries({ queryKey: ["course-folders"] });
    },
    onError: toastError,
  });
}
