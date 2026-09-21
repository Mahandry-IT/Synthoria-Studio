import { getJson, postJson } from "@/shared/api/httpClient";
import type { PaginatedResponse } from "@/shared/types/pagination";
import type {
  CourseFromPlanRequest,
  CourseGenerationRequest,
  CourseGenerationResponse,
  CoursePlan,
  CoursePlanRequest,
  MoreSectionsRequest,
  PendingPlanDetail,
  PendingPlanItem,
  PlannedSection,
  RecallResponse,
  RefineSectionRequest,
} from "./course.types";
import {
  courseFromPlanRequestSchema,
  coursePlanSchema,
  courseResponseSchema,
  moreSectionsResponseSchema,
  pendingPlanDetailSchema,
  pendingPlansResponseSchema,
  plannedSectionSchema,
  recallRequestSchema,
  recallResponseSchema,
} from "./course.schema";

/** La génération peut durer plusieurs minutes (lots de sections). */
const GENERATION_TIMEOUT_MS = 300_000;
/** Un cours long est généré par lots de sections : durée supérieure à la génération directe. */
const FROM_PLAN_TIMEOUT_MS = 600_000;
/** Le plan est un seul appel structuré, plus court. */
const PLAN_TIMEOUT_MS = 120_000;
/** Complétion d'une section / nouvelles sections : un appel structuré (+ recherche ciblée). */
const PLAN_ASSIST_TIMEOUT_MS = 120_000;

/**
 * Valide la réponse d'un cours par Zod ; en cas d'écart, retourne les données
 * brutes (le frontend gère les champs null/undefined de toute façon).
 */
function parseCourseResponse(raw: CourseGenerationResponse): CourseGenerationResponse {
  const parsed = courseResponseSchema.safeParse(raw);

  if (!parsed.success) {
    console.error("Zod validation failed for course response:", parsed.error);
    return raw;
  }

  return parsed.data;
}

/**
 * Génère un cours structuré via l'endpoint backend (génération directe, sans plan).
 * La réponse est validée par Zod avant d'être retournée.
 *
 * @throws {HttpError} en cas d'erreur HTTP (413/429/502/503)
 * @throws {z.ZodError} si la réponse ne correspond pas au schéma attendu
 */
export async function generateCourse(
  payload: CourseGenerationRequest,
): Promise<CourseGenerationResponse> {
  const raw = await postJson<CourseGenerationResponse>(
    "/courses/generate",
    payload,
    { timeout: GENERATION_TIMEOUT_MS, noRetry: true },
  );

  return parseCourseResponse(raw);
}

/**
 * Étape 1 : génère le plan détaillé d'un cours (structure sans contenu rédigé).
 *
 * @throws {HttpError} en cas d'erreur HTTP (413/429/502/503)
 * @throws {Error} si la réponse ne correspond pas au schéma de plan attendu
 */
export async function generateCoursePlan(payload: CoursePlanRequest): Promise<CoursePlan> {
  const raw = await postJson<unknown>("/courses/plan", payload, {
    timeout: PLAN_TIMEOUT_MS,
    noRetry: true,
  });

  const parsed = coursePlanSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Zod validation failed for course plan:", parsed.error);
    throw new Error("Réponse invalide du moteur IA pour le plan. Réessayez.");
  }

  return parsed.data;
}

/**
 * Étape 2 : génère le cours complet à partir du plan validé (ou édité).
 * Le plan est revalidé côté client avant envoi (mêmes règles que le backend).
 *
 * @throws {Error} si le plan édité est invalide
 * @throws {HttpError} en cas d'erreur HTTP (404 plan inconnu, 410 plan expiré, 422, 429, 502, 503)
 */
export async function generateCourseFromPlan(
  payload: CourseFromPlanRequest,
): Promise<CourseGenerationResponse> {
  const validated = courseFromPlanRequestSchema.safeParse(payload);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Plan invalide.");
  }

  const raw = await postJson<CourseGenerationResponse>(
    "/courses/generate/from-plan",
    validated.data,
    { timeout: FROM_PLAN_TIMEOUT_MS, noRetry: true },
  );

  return parseCourseResponse(raw);
}

/**
 * Complète une section de plan jugée incomplète : l'IA ajoute ce qui manque (avec les
 * précisions de l'utilisateur si `instructions` est renseigné, sinon de sa propre initiative).
 *
 * @throws {HttpError} en cas d'erreur HTTP (404 plan inconnu, 410 plan expiré, 422, 429, 502, 503)
 * @throws {Error} si la réponse ne correspond pas au schéma de section attendu
 */
export async function refinePlanSection(payload: RefineSectionRequest): Promise<PlannedSection> {
  const raw = await postJson<unknown>("/courses/plan/refine-section", payload, {
    timeout: PLAN_ASSIST_TIMEOUT_MS,
    noRetry: true,
  });

  const parsed = plannedSectionSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Zod validation failed for refined section:", parsed.error);
    throw new Error("Réponse invalide du moteur IA pour la section. Réessayez.");
  }

  return parsed.data;
}

/** Nouvelles sections + « Pour aller plus loin » actualisée (null si le plan n'en avait pas). */
export interface MoreSectionsResult {
  sections: PlannedSection[];
  nextSteps: PlannedSection | null;
}

/**
 * Génère de nouvelles sections de développement à partir de « Pour aller plus loin ».
 *
 * @throws {HttpError} en cas d'erreur HTTP (404 plan inconnu, 410 plan expiré, 422, 429, 502, 503)
 * @throws {Error} si la réponse ne correspond pas au schéma attendu
 */
export async function generateMoreSections(payload: MoreSectionsRequest): Promise<MoreSectionsResult> {
  const raw = await postJson<unknown>("/courses/plan/more-sections", payload, {
    timeout: PLAN_ASSIST_TIMEOUT_MS,
    noRetry: true,
  });

  const parsed = moreSectionsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Zod validation failed for more sections:", parsed.error);
    throw new Error("Réponse invalide du moteur IA pour les nouvelles sections. Réessayez.");
  }

  return { sections: parsed.data.sections, nextSteps: parsed.data.next_steps ?? null };
}

/**
 * Plans en cours : proposés, non expirés et pas encore transformés en cours (dashboard).
 *
 * @throws {HttpError} en cas d'erreur HTTP
 * @throws {Error} si la réponse ne correspond pas au schéma attendu
 */
export async function listPendingPlans(page: number, limit: number): Promise<PaginatedResponse<PendingPlanItem>> {
  const raw = await getJson<unknown>("/courses/plans", { params: { page, limit } });

  const parsed = pendingPlansResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Zod validation failed for pending plans:", parsed.error);
    throw new Error("Réponse invalide du serveur pour les plans en cours.");
  }

  return parsed.data;
}

/**
 * Relit un plan proposé (sections + requête d'origine) pour le reprendre.
 *
 * @throws {HttpError} 404 plan inconnu, 410 plan expiré
 * @throws {Error} si la réponse ne correspond pas au schéma attendu
 */
export async function getPendingPlan(planId: string): Promise<PendingPlanDetail> {
  const raw = await getJson<unknown>(`/courses/plans/${encodeURIComponent(planId)}`);

  const parsed = pendingPlanDetailSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Zod validation failed for pending plan detail:", parsed.error);
    throw new Error("Réponse invalide du serveur pour le plan.");
  }

  return parsed.data;
}

/** Évaluation courte (un appel structuré). */
const RECALL_TIMEOUT_MS = 60_000;

/**
 * Évalue la reformulation d'une section (« explique avec tes mots »). La section et ses points
 * attendus sont lus côté serveur : seul le texte de l'apprenant est envoyé.
 *
 * @throws {Error} si la réponse est vide ou trop longue, ou si la réponse du serveur est invalide
 * @throws {HttpError} 404 session/section inconnue, 422, 429 (trop d'évaluations), 502, 503
 */
export async function evaluateRecall(
  sessionId: string,
  sectionId: string,
  answer: string,
): Promise<RecallResponse> {
  const request = recallRequestSchema.safeParse({ answer });
  if (!request.success) throw new Error(request.error.issues[0]?.message ?? "Réponse invalide.");

  const raw = await postJson<unknown>(
    `/courses/${encodeURIComponent(sessionId)}/sections/${encodeURIComponent(sectionId)}/recall`,
    request.data,
    { timeout: RECALL_TIMEOUT_MS, noRetry: true },
  );

  const parsed = recallResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Zod validation failed for recall:", parsed.error);
    throw new Error("Réponse invalide du moteur IA pour l'évaluation. Réessayez.");
  }
  return parsed.data;
}
