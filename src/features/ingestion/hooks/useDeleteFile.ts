"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFile } from "../ingestion.api";
import { toastError, toastSuccess } from "@/shared/ui/toast";

/** Supprime un fichier ingéré ; rafraîchit les listes de fichiers (page d'upload et sélecteur de /ask). */
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filename: string) => deleteFile(filename),
    onSuccess: (_data, filename) => {
      toastSuccess(`« ${filename} » supprimé.`);
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["allFiles"] });
    },
    onError: (err) => {
      toastError(err);
      // Fichier déjà supprimé ailleurs (404) : la liste doit se resynchroniser
      queryClient.invalidateQueries({ queryKey: ["allFiles"] });
    },
  });
}
