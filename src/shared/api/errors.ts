import { ERROR_MESSAGES } from "@/features/course/course.types";
import type { HttpError } from "@/shared/api/httpClient";

/**
 * Extrait le message lisible depuis une erreur HTTP.
 * Priorité : body.detail (FastAPI) → ERROR_MESSAGES[status] → error.message
 *
 * Inclut une défense de dé-imbrication : si `detail` est encore une chaîne
 * JSON (double-encodage résiduel d'un ancien endpoint), elle est parsée
 * pour extraire le vrai message.
 */
export function resolveErrorMessage(err: unknown): string {
  if (err instanceof Error && "status" in err) {
    const httpErr = err as HttpError;
    let bodyDetail =
      httpErr.body && typeof httpErr.body === "object"
        ? (httpErr.body as Record<string, unknown>).detail
        : undefined;

    // Défense : si detail est une chaîne JSON imbriquée, la dé-encoder
    if (typeof bodyDetail === "string" && bodyDetail) {
      try {
        const parsed = JSON.parse(bodyDetail);
        if (typeof parsed.detail === "string") bodyDetail = parsed.detail;
      } catch {
        // Ce n'est pas du JSON imbriqué, on garde la valeur telle quelle
      }
    }

    if (typeof bodyDetail === "string" && bodyDetail) return bodyDetail;
    if (httpErr.status in ERROR_MESSAGES) return ERROR_MESSAGES[httpErr.status];
  }

  if (err instanceof Error) return err.message;
  if (typeof err === "string" && err) return err;
  return "Une erreur inattendue est survenue.";
}
