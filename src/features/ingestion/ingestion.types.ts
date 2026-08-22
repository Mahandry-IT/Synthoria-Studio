import type { FileIngestStatus } from "@/features/course/course.types";

// ─── PDF Ingestion Response ─────────────────────────────────

export interface IngestedFile {
  filename: string;
  status: FileIngestStatus;
  message: string;
  chunks?: number | null;
}

export interface PDFIngestResponse {
  files: IngestedFile[];
  total_chunks: number;
}

export interface PDFIngestMultiResponse {
  results: IngestedFile[];
  total_files: number;
  total_chunks: number;
}

// ─── File List Response ─────────────────────────────────────

export interface FileInfo {
  filename: string;
  size_bytes?: number | null;
  ingested_at?: string | null;
  chunks?: number | null;
}

export interface FileListResponse {
  files: FileInfo[];
  total: number;
}
