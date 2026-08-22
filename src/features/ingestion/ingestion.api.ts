import { postMultipart, getJson } from "@/shared/api/httpClient";
import type { PDFIngestMultiResponse, FileListResponse } from "./ingestion.types";

/**
 * Upload un ou plusieurs fichiers PDF pour ingestion.
 *
 * @param files - Tableau de fichiers File à uploader
 * @throws {HttpError} en cas d'erreur serveur
 */
export async function ingestPdf(files: File[]): Promise<PDFIngestMultiResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  return postMultipart<PDFIngestMultiResponse>("/pdf/ingest", formData);
}

/**
 * Liste les fichiers PDF déjà ingestés.
 *
 * @throws {HttpError} en cas d'erreur serveur
 */
export async function listFiles(): Promise<FileListResponse> {
  return getJson<FileListResponse>("/pdf/files");
}
