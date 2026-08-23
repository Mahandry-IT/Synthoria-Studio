import type { FileIngestStatus } from "@/features/course/course.types";
import type { PaginationMeta } from "@/shared/types/pagination";

// ─── PDF Ingestion Response ─────────────────────────────────

export interface IngestedFile {
  filename: string;
  status: FileIngestStatus;
  message: string;
  chunks_added?: number | null;
  documents_added?: number | null;
}

export interface PDFIngestResponse {
  status: string;
  files: IngestedFile[];
  total_chunks: number;
  total_documents: number;
}

// ─── File List Response ─────────────────────────────────────

export interface FileInfo {
  filename: string;
  size_bytes?: number | null;
  ingested_at?: string | null;
  chunks?: number | null;
}

export interface FileListResponse {
  status: string;
  data: FileInfo[];
  meta: PaginationMeta;
}
