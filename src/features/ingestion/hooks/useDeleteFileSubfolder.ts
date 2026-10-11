"use client";

import { useMutation } from "@tanstack/react-query";
import { deleteFileSubfolder } from "../ingestion.api";
import { useInvalidateFiles } from "./useInvalidateFiles";
import { DEFAULT_SUBFOLDER } from "@/components/folders/folders.constants";
import { toastError, toastSuccess } from "@/shared/ui/toast";

interface DeleteFileSubfolderArgs {
  folder: string;
  subfolder: string;
}

/** Supprime un sous-dossier de fichiers : ses fichiers rejoignent le sous-dossier par défaut. */
export function useDeleteFileSubfolder() {
  const invalidateFiles = useInvalidateFiles();

  return useMutation({
    mutationFn: ({ folder, subfolder }: DeleteFileSubfolderArgs) => deleteFileSubfolder(folder, subfolder),
    onSuccess: ({ moved }) => {
      toastSuccess(
        moved > 0
          ? `Sous-dossier supprimé : ${moved} fichier(s) déplacé(s) vers « ${DEFAULT_SUBFOLDER} ».`
          : "Sous-dossier supprimé.",
      );
      invalidateFiles();
    },
    onError: (err) => toastError(err),
  });
}
