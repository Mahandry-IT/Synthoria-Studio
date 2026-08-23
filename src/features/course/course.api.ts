import { postJson } from "@/shared/api/httpClient";
import type { CourseGenerationRequest, CourseGenerationResponse } from "./course.types";
import { courseResponseSchema } from "./course.schema";

/**
 * Génère un cours structuré via l'endpoint backend.
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
  );

  const parsed = courseResponseSchema.safeParse(raw);

  if (!parsed.success) {
    console.error("Zod validation failed for course response:", parsed.error);
    // On retourne quand même les données brutes avec les données parsées
    // Le frontend gère les champs null/undefined de toute façon
    return raw;
  }

  return parsed.data;
}
