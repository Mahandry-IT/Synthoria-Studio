"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ingestPdf } from "../ingestion.api";
import type { PDFIngestResponse } from "../ingestion.types";
import type { FolderTarget } from "@/components/folders/folders.types";
import { HttpError } from "@/shared/api/httpClient";
import { toastError, toastSuccess, toastWarning } from "@/shared/ui/toast";

interface UseIngestPdfReturn {
  /** `target` absent = fichiers rangés dans le dossier par défaut. */
  mutate: (files: File[], target?: FolderTarget) => void;
  data: PDFIngestResponse | null;
  error: HttpError | null;
  isPending: boolean;
}

/**
 * Mutation React Query pour l'upload de PDFs.
 * Invalide le cache de useFiles() et useAllFiles() après succès pour rafraîchir la liste.
 */
export function useIngestPdf(): UseIngestPdfReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ files, target }: { files: File[]; target?: FolderTarget }) => ingestPdf(files, target),
    onSuccess: (data) => {
      const count = data.files?.length ?? 0;
      const failedFiles = data.files?.filter((f) => f.status === "failed" || f.status === "error") ?? [];
      const failed = failedFiles.length;
      if (count > 0 && failed === 0) {
        toastSuccess(`${count} fichier(s) ingéré(s) avec succès !`);
      } else if (failed > 0 && failed < count) {
        toastWarning(`${failed} fichier(s) échoué(s) sur ${count}.`);
      } else if (failed > 0) {
        // Message du serveur (ex. « File already uploaded ») plutôt qu'un texte générique
        const alreadyUploaded = failedFiles.every((f) => /already uploaded/i.test(f.message ?? ""));
        if (alreadyUploaded) {
          toastWarning(
            failed === 1
              ? `« ${failedFiles[0].filename} » a déjà été importé.`
              : `${failed} fichiers ont déjà été importés.`,
          );
        } else {
          toastError(new Error(failedFiles.map((f) => `${f.filename} : ${f.message}`).join(" — ")));
        }
      }
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["allFiles"] });
    },
    onError: (err) => {
      toastError(err);
    },
  });

  const { mutate: mutateIngest } = mutation;
  const mutate = useCallback(
    (files: File[], target?: FolderTarget) => mutateIngest({ files, target }),
    [mutateIngest],
  );

  return {
    mutate,
    data: mutation.data ?? null,
    error: mutation.error instanceof HttpError ? mutation.error : null,
    isPending: mutation.isPending,
  };
}
