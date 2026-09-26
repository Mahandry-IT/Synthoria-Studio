import type { CourseGenerationResponse } from "@/features/course/course.types";

export interface CourseHistoryItem {
  id: string;
  created_at: string;
  question: string;
  filenames: string[];
  mode: "file_question" | "question_only";
  folder: string;
  subfolder: string;
}

export interface CourseHistoryDetail extends CourseHistoryItem {
  gemini_response: CourseGenerationResponse;
}

/**
 * Rangement des cours en dossiers/sous-dossiers : un simple attribut du cours côté backend
 * (aucune entité dossier séparée) — un dossier n'existe dans cette liste qu'autant qu'au moins
 * un cours y est rangé.
 */
export interface CourseSubfolderSummary {
  name: string;
  course_count: number;
}

export interface CourseFolder {
  name: string;
  course_count: number;
  subfolders: CourseSubfolderSummary[];
}

/** Filtre courant de l'historique par dossier. `null` (hors de ce type) = tous les cours. */
export interface CourseFolderFilter {
  folder: string;
  subfolder?: string;
}
