import type { CourseVideo } from "./course.types";

export const CATEGORY_LABELS: Record<string, string> = {
  cours: "Cours",
  exercices_corriges: "Exercices corrigés",
  intuition: "Intuition",
  demonstration: "Démonstration",
  methode: "Méthode",
};

export const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

export interface VideoGroup {
  /** `null` = pas de regroupement (classement V2 absent, ou une seule catégorie). */
  category: string | null;
  videos: CourseVideo[];
}

/**
 * Regroupe les vidéos par catégorie (V2) — seulement si au moins 2 catégories distinctes sont
 * présentes ; sinon un seul groupe non catégorisé (comportement V1 inchangé), dans l'ordre reçu.
 */
export function groupByCategory(videos: CourseVideo[]): VideoGroup[] {
  const categories = new Set(videos.map((v) => v.category).filter((c): c is string => Boolean(c)));
  if (categories.size < 2) {
    return videos.length > 0 ? [{ category: null, videos }] : [];
  }

  const order: string[] = [];
  const byCategory = new Map<string, CourseVideo[]>();
  for (const video of videos) {
    const key = video.category ?? "";
    if (!byCategory.has(key)) {
      order.push(key);
      byCategory.set(key, []);
    }
    byCategory.get(key)!.push(video);
  }
  return order.map((category) => ({ category: category || null, videos: byCategory.get(category)! }));
}
