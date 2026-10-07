"use client";

import { useMutation } from "@tanstack/react-query";
import { deleteFileFolder } from "../ingestion.api";
import { useInvalidateFiles } from "./useInvalidateFiles";
import { DEFAULT_FOLDER } from "@/components/folders/folders.constants";
import { toastError, toastSuccess } from "@/shared/ui/toast";

/** Supprime un dossier de fichiers : ses fichiers rejoignent le dossier par défaut (aucun n'est supprimé). */
export function useDeleteFileFolder() {
  const invalidateFiles = useInvalidateFiles();

  return useMutation({
    mutationFn: (folder: string) => deleteFileFolder(folder),
    onSuccess: ({ moved }) => {
      toastSuccess(
        moved > 0 ? `Dossier supprimé : ${moved} fichier(s) déplacé(s) vers « ${DEFAULT_FOLDER} ».` : "Dossier supprimé.",
      );
      invalidateFiles();
    },
    onError: toastError,
  });
}
