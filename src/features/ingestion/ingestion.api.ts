import { postMultipart, getJson } from "@/shared/api/httpClient";
import type { PDFIngestResponse, FileListResponse } from "./ingestion.types";

/**
 * Upload un ou plusieurs fichiers PDF pour ingestion.
 *
 * @param files - Tableau de fichiers File à uploader
 * @throws {HttpError} en cas d'erreur serveur
 */
export async function ingestPdf(files: File[]): Promise<PDFIngestResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  return postMultipart<PDFIngestResponse>("/pdf/ingest", formData);
}

/**
 * Liste les fichiers PDF déjà ingestés, avec pagination.
 *
 * @param page - Numéro de page (≥ 1)
 * @param limit - Nombre d'éléments par page
 * @throws {HttpError} en cas d'erreur serveur
 */
export async function listFiles(
  page: number = 1,
  limit: number = 10,
): Promise<FileListResponse> {
  return getJson<FileListResponse>("/pdf/files", {
    params: { page, limit },
  });
}
