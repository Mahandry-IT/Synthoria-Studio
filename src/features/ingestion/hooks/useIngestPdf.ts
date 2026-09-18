"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ingestPdf } from "../ingestion.api";
import type { PDFIngestResponse } from "../ingestion.types";
import { HttpError } from "@/shared/api/httpClient";
import { toastError, toastSuccess, toastWarning } from "@/shared/ui/toast";

interface UseIngestPdfReturn {
  mutate: (files: File[]) => void;
  data: PDFIngestResponse | null;
  error: HttpError | null;
  isPending: boolean;
}

/**
 * Mutation React Query pour l'upload de PDFs.
 * Invalide le cache de useFiles() après succès pour rafraîchir la liste.
 */
export function useIngestPdf(): UseIngestPdfReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ingestPdf,
    onSuccess: (data) => {
      const count = data.files?.length ?? 0;
      const failed = data.files?.filter((f) => f.status === "failed" || f.status === "error").length ?? 0;
      if (count > 0 && failed === 0) {
        toastSuccess(`${count} fichier(s) ingéré(s) avec succès !`);
      } else if (failed > 0 && failed < count) {
        toastWarning(`${failed} fichier(s) échoué(s) sur ${count}.`);
      } else if (count > 0 && failed === count) {
        toastError(`${failed} fichier(s) échoué(s).`);
      }
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (err) => {
      toastError(err);
    },
  });

  return {
    mutate: mutation.mutate,
    data: mutation.data ?? null,
    error: mutation.error instanceof HttpError ? mutation.error : null,
    isPending: mutation.isPending,
  };
}
