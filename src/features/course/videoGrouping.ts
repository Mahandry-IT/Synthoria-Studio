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

/** Même plafond que le backend (`COURSE_VIDEOS_MAX_PER_SECTION`), réappliqué ici par défense. */
export const MAX_VIDEOS_PER_SECTION = 2;

export interface VideosBySection {
  /** Vidéos à afficher au niveau du cours. */
  general: CourseVideo[];
  /** Vidéos à afficher dans chaque section, par `id` de section. */
  bySection: Map<string, CourseVideo[]>;
}

/**
 * Répartit les vidéos entre le cours et ses sections, dans l'ordre reçu. Une vidéo sans
 * `section_id`, rattachée à une section inconnue (supprimée, cours ancien) ou en surnombre pour sa
 * section reste une vidéo générale : aucune vidéo n'est jamais perdue.
 * @example splitVideosBySection([{ ...v, section_id: "s1" }], ["s1"]).bySection.get("s1") // [v]
 */
export function splitVideosBySection(videos: CourseVideo[], sectionIds: string[]): VideosBySection {
  const known = new Set(sectionIds);
  const general: CourseVideo[] = [];
  const bySection = new Map<string, CourseVideo[]>();

  for (const video of videos) {
    const sectionId = video.section_id && known.has(video.section_id) ? video.section_id : null;
    const attached = sectionId ? bySection.get(sectionId) ?? [] : [];
    if (!sectionId || attached.length >= MAX_VIDEOS_PER_SECTION) {
      general.push(video);
      continue;
    }
    bySection.set(sectionId, [...attached, video]);
  }
  return { general, bySection };
}
