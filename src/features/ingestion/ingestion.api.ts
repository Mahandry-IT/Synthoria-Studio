import { postMultipart, getJson } from "@/shared/api/httpClient";
import type {
  PDFIngestResponse,
  RawPDFIngestResponse,
  FileListResponse,
} from "./ingestion.types";

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
  const raw = await postMultipart<RawPDFIngestResponse>("/pdf/ingest", formData);
  return normalizeIngestResponse(raw);
}

/** Ramène la réponse mono-fichier du backend à la forme multi-fichiers. */
function normalizeIngestResponse(raw: RawPDFIngestResponse): PDFIngestResponse {
  if ("files" in raw) return raw;

  const chunks = raw.chunks_added ?? 0;
  const docs = raw.documents_added ?? 0;
  return {
    status: raw.status,
    files: [
      {
        filename: raw.filename,
        status: raw.status === "ok" ? "ok" : "failed",
        message: raw.message ?? "",
        chunks_added: chunks,
        documents_added: docs,
      },
    ],
    total_chunks: chunks,
    total_documents: docs,
  };
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
