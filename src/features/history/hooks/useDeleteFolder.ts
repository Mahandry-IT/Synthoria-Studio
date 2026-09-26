"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFolder } from "../history.api";
import { DEFAULT_FOLDER } from "../history.constants";
import { toastError, toastSuccess } from "@/shared/ui/toast";

/** Supprime un dossier : ses cours rejoignent le dossier par défaut. Rafraîchit liste + arborescence. */
export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deleteFolder(name),
    onSuccess: ({ moved }) => {
      toastSuccess(
        moved > 0
          ? `Dossier supprimé : ${moved} cours déplacé(s) vers « ${DEFAULT_FOLDER} ».`
          : "Dossier supprimé.",
      );
      queryClient.invalidateQueries({ queryKey: ["course-history"] });
      queryClient.invalidateQueries({ queryKey: ["course-folders"] });
    },
    onError: toastError,
  });
}
