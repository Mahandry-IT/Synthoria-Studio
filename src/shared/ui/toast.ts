import { toast } from "react-toastify";

import { ERROR_MESSAGES } from "@/features/course/course.types";
import type { HttpError } from "@/shared/api/httpClient";

/**
 * Extrait le message lisible depuis une erreur HTTP.
 * Priorité : body.detail (FastAPI) → ERROR_MESSAGES[status] → error.message
 */
function resolveErrorMessage(err: unknown): string {
  if (err instanceof Error && "status" in err) {
    const httpErr = err as HttpError;
    const bodyDetail =
      httpErr.body && typeof httpErr.body === "object"
        ? (httpErr.body as Record<string, unknown>).detail
        : undefined;

    if (typeof bodyDetail === "string" && bodyDetail) return bodyDetail;
    if (httpErr.status in ERROR_MESSAGES) return ERROR_MESSAGES[httpErr.status];
  }

  if (err instanceof Error) return err.message;
  return "Une erreur inattendue est survenue.";
}

/** Toast erreur — fermeture auto après 6 s */
export function toastError(err: unknown): void {
  toast.error(resolveErrorMessage(err), { autoClose: 6_000 });
}

/** Toast succès — fermeture auto après 4 s */
export function toastSuccess(message: string): void {
  toast.success(message, { autoClose: 4_000 });
}

/** Toast warning — fermeture auto après 5 s */
export function toastWarning(message: string): void {
  toast.warning(message, { autoClose: 5_000 });
}
