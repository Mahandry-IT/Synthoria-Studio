import type { CourseGenerationResponse, CoursePlan, CoursePlanRequest } from "./course.types";

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
