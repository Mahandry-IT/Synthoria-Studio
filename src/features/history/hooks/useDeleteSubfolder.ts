"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSubfolder } from "../history.api";
import { DEFAULT_SUBFOLDER } from "../history.constants";
import { toastError, toastSuccess } from "@/shared/ui/toast";

interface DeleteSubfolderArgs {
  folder: string;
  subfolder: string;
}

/** Supprime un sous-dossier : ses cours rejoignent le sous-dossier par défaut. Rafraîchit liste + arborescence. */
export function useDeleteSubfolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folder, subfolder }: DeleteSubfolderArgs) => deleteSubfolder(folder, subfolder),
    onSuccess: ({ moved }) => {
      toastSuccess(
        moved > 0
          ? `Sous-dossier supprimé : ${moved} cours déplacé(s) vers « ${DEFAULT_SUBFOLDER} ».`
          : "Sous-dossier supprimé.",
      );
      queryClient.invalidateQueries({ queryKey: ["course-history"] });
      queryClient.invalidateQueries({ queryKey: ["course-folders"] });
    },
    onError: toastError,
  });
}
