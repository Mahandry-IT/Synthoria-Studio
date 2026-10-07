"use client";

import { useMutation } from "@tanstack/react-query";
import { moveFileToFolder } from "../ingestion.api";
import { useInvalidateFiles } from "./useInvalidateFiles";
import { toastError, toastSuccess } from "@/shared/ui/toast";

interface MoveFileArgs {
  filename: string;
  folder: string;
  subfolder?: string | null;
}

/** Range un fichier dans un dossier/sous-dossier ; rafraîchit les listes de fichiers. */
export function useMoveFileToFolder() {
  const invalidateFiles = useInvalidateFiles();

  return useMutation({
    mutationFn: ({ filename, folder, subfolder }: MoveFileArgs) => moveFileToFolder(filename, { folder, subfolder }),
    onSuccess: ({ filename, folder }) => {
      toastSuccess(`« ${filename} » déplacé vers « ${folder} ».`);
      invalidateFiles();
    },
    onError: (err) => {
      toastError(err);
      // Fichier supprimé ailleurs (404) : la liste doit se resynchroniser
      invalidateFiles();
    },
  });
}
