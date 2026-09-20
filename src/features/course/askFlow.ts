import type { CourseGenerationResponse, CoursePlan, CoursePlanRequest } from "./course.types";

/** Clés de sessionStorage de l'état de /ask (partagées avec le dashboard pour « Reprendre le plan »). */
export const COURSE_STORAGE_KEY = "synthoria:last-course";
export const PENDING_PLAN_STORAGE_KEY = "synthoria:pending-plan";

/** Phases de la page /ask : question → revue du plan → cours. */
export type AskPhase = "question" | "plan_review" | "course";

/** Plan en cours de revue, avec la requête d'origine (pour « Régénérer le plan »). */
export interface PendingPlan {
  request: CoursePlanRequest;
  plan: CoursePlan;
}

/**
 * Déduit la phase à afficher de l'état persisté.
 * Un plan en attente prime sur un ancien cours : le plan est l'étape la plus récente.
 */
export function resolveAskPhase(
  pendingPlan: PendingPlan | null,
  course: CourseGenerationResponse | null,
): AskPhase {
  if (pendingPlan) return "plan_review";
  if (course) return "course";
  return "question";
}

/**
 * Construit le plan en attente de revue à partir d'un plan relu côté backend.
 * `filename` n'est renseigné que si des fichiers étaient sélectionnés (une chaîne pour un seul).
 */
export function toPendingPlan(detail: CoursePlan & { question: string; filenames: string[] }): PendingPlan {
  const { question, filenames, ...plan } = detail;
  const filename = filenames.length === 0 ? undefined : filenames.length === 1 ? filenames[0] : filenames;
  return { request: { question, ...(filename ? { filename } : {}) }, plan };
}

/**
 * Dépose un plan à reprendre dans le sessionStorage : /ask l'y lit à son montage et ouvre la
 * revue du plan. No-op silencieux si le stockage est indisponible (mode privé).
 */
export function storePendingPlan(pending: PendingPlan): boolean {
  try {
    sessionStorage.setItem(PENDING_PLAN_STORAGE_KEY, JSON.stringify(pending));
    return true;
  } catch {
    return false;
  }
}
