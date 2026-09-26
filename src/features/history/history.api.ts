import { deleteJson, getJson } from "@/shared/api/httpClient";
import type { PaginatedResponse } from "@/shared/types/pagination";
import type { CourseHistoryItem, CourseHistoryDetail } from "./history.types";

/**
 * Récupère l'historique paginé des cours générés.
 */
export function getCourseHistory(
  page: number,
  limit: number,
): Promise<PaginatedResponse<CourseHistoryItem>> {
  return getJson<PaginatedResponse<CourseHistoryItem>>("/courses/history", {
    params: { page, limit },
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
