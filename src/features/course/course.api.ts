import { postJson } from "@/shared/api/httpClient";
import type {
  CourseFromPlanRequest,
  CourseGenerationRequest,
  CourseGenerationResponse,
  CoursePlan,
  CoursePlanRequest,
  MoreSectionsRequest,
  PlannedSection,
  RefineSectionRequest,
} from "./course.types";
import {
  courseFromPlanRequestSchema,
  coursePlanSchema,
  courseResponseSchema,
  moreSectionsResponseSchema,
  plannedSectionSchema,
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

/**
 * Génère de nouvelles sections de développement à partir de « Pour aller plus loin ».
 *
 * @throws {HttpError} en cas d'erreur HTTP (404 plan inconnu, 410 plan expiré, 422, 429, 502, 503)
 * @throws {Error} si la réponse ne correspond pas au schéma attendu
 */
export async function generateMoreSections(payload: MoreSectionsRequest): Promise<PlannedSection[]> {
  const raw = await postJson<unknown>("/courses/plan/more-sections", payload, {
    timeout: PLAN_ASSIST_TIMEOUT_MS,
    noRetry: true,
  });

  const parsed = moreSectionsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Zod validation failed for more sections:", parsed.error);
    throw new Error("Réponse invalide du moteur IA pour les nouvelles sections. Réessayez.");
  }

  return parsed.data.sections;
}
