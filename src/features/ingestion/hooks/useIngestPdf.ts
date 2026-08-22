"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ingestPdf } from "../ingestion.api";
import type { PDFIngestMultiResponse } from "../ingestion.types";
import { HttpError } from "@/shared/api/httpClient";

interface UseIngestPdfReturn {
  mutate: (files: File[]) => void;
  data: PDFIngestMultiResponse | null;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  return {
    mutate: mutation.mutate,
    data: mutation.data ?? null,
    error: mutation.error instanceof HttpError ? mutation.error : null,
    isPending: mutation.isPending,
  };
}
