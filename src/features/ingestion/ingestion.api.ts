import { postMultipart, getJson, deleteJson, putJson } from "@/shared/api/httpClient";
import type { FolderTarget } from "@/components/folders/folders.types";
import type {
  FileFolderResult,
  PDFIngestResponse,
  RawPDFIngestResponse,
  FileListResponse,
} from "./ingestion.types";

/**
 * Upload un ou plusieurs fichiers PDF pour ingestion.
 *
 * @param files - Tableau de fichiers File à uploader
 * @param target - Dossier de rangement des fichiers ; absent = dossier par défaut
 * @throws {HttpError} en cas d'erreur serveur
 */
export async function ingestPdf(files: File[], target?: FolderTarget): Promise<PDFIngestResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  if (target) {
    formData.append("folder", target.folder);
    if (target.subfolder) formData.append("subfolder", target.subfolder);
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

/**
 * Supprime un fichier PDF ingéré (et ses données côté backend).
 *
 * @param filename - Nom du fichier tel que renvoyé par la liste
 * @throws {HttpError} 404 fichier inconnu
 */
export async function deleteFile(filename: string): Promise<void> {
  await deleteJson<void>(`/pdf/files/${encodeURIComponent(filename)}`);
}

/**
 * Range un fichier dans un dossier/sous-dossier, créés implicitement s'ils n'existent pas encore.
 *
 * @throws {HttpError} 404 fichier inconnu, 422 nom de dossier invalide
 */
export function moveFileToFolder(filename: string, target: FolderTarget): Promise<FileFolderResult> {
  return putJson<FileFolderResult>(`/pdf/files/${encodeURIComponent(filename)}/folder`, target);
}

/**
 * Supprime un dossier de fichiers : ses fichiers rejoignent le dossier par défaut (aucun fichier
 * supprimé).
 *
 * @throws {HttpError} 400 si `folder` est le dossier par défaut
 */
export function deleteFileFolder(folder: string): Promise<{ moved: number }> {
  return deleteJson<{ moved: number }>(`/pdf/folders/${encodeURIComponent(folder)}`);
}

/**
 * Supprime un sous-dossier de fichiers : ses fichiers rejoignent le sous-dossier par défaut.
 *
 * @throws {HttpError} 400 si `subfolder` est le sous-dossier par défaut
 */
export function deleteFileSubfolder(folder: string, subfolder: string): Promise<{ moved: number }> {
  return deleteJson<{ moved: number }>(
    `/pdf/folders/${encodeURIComponent(folder)}/subfolders/${encodeURIComponent(subfolder)}`,
  );
}
