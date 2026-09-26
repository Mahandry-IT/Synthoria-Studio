import { deleteJson, getJson, putJson } from "@/shared/api/httpClient";
import type { PaginatedResponse } from "@/shared/types/pagination";
import type { CourseFolder, CourseFolderFilter, CourseHistoryItem, CourseHistoryDetail } from "./history.types";

/**
 * Récupère l'historique paginé des cours générés, éventuellement filtré par dossier/sous-dossier.
 */
export function getCourseHistory(
  page: number,
  limit: number,
  filter?: CourseFolderFilter,
): Promise<PaginatedResponse<CourseHistoryItem>> {
  return getJson<PaginatedResponse<CourseHistoryItem>>("/courses/history", {
    params: { page, limit, folder: filter?.folder, subfolder: filter?.subfolder },
  });
}

/**
 * Récupère le détail d'un cours par son ID.
 * Laisse remonter HttpError (404 si introuvable).
 */
export function getCourseHistoryById(id: string): Promise<CourseHistoryDetail> {
  return getJson<CourseHistoryDetail>(`/courses/history/${id}`);
}

/**
 * Supprime un cours de l'historique (et son contenu associé : podcast, notes, révisions).
 * Laisse remonter HttpError (404 si introuvable).
 */
export function deleteCourse(id: string): Promise<void> {
  return deleteJson<void>(`/courses/history/${encodeURIComponent(id)}`);
}

/**
 * Dossiers/sous-dossiers réellement utilisés (au moins un cours dedans), avec leur nombre de
 * cours. Un dossier n'est qu'un attribut porté par chaque cours (aucune entité séparée côté API).
 */
export function getCourseFolders(): Promise<CourseFolder[]> {
  return getJson<CourseFolder[]>("/courses/folders");
}

/**
 * Déplace un cours vers un dossier/sous-dossier — créés implicitement s'ils n'existent pas
 * encore. `subfolder` omis/null = sous-dossier par défaut du dossier cible.
 */
export function moveCourseToFolder(
  sessionId: string,
  body: { folder: string; subfolder?: string | null },
): Promise<CourseHistoryItem> {
  return putJson<CourseHistoryItem>(`/courses/history/${encodeURIComponent(sessionId)}/folder`, body);
}

/**
 * Supprime un dossier : ses cours (et ceux de ses sous-dossiers) rejoignent le dossier par défaut.
 * Laisse remonter HttpError (400 si `name` est le dossier par défaut lui-même).
 */
export function deleteFolder(name: string): Promise<{ moved: number }> {
  return deleteJson<{ moved: number }>(`/courses/folders/${encodeURIComponent(name)}`);
}

/**
 * Supprime un sous-dossier : ses cours rejoignent le sous-dossier par défaut, dans le même
 * dossier. Laisse remonter HttpError (400 si `subfolder` est le sous-dossier par défaut lui-même).
 */
export function deleteSubfolder(folder: string, subfolder: string): Promise<{ moved: number }> {
  return deleteJson<{ moved: number }>(
    `/courses/folders/${encodeURIComponent(folder)}/subfolders/${encodeURIComponent(subfolder)}`,
  );
}
