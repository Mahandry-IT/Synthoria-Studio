import { resolveErrorMessage } from "@/shared/api/errors";
import { HttpError } from "@/shared/api/httpClient";

const QUOTA_FALLBACK = "Quota Gemini atteint.";

/**
 * Message d'erreur d'une régénération de section.
 * Sur un 429, le `detail` du backend est complété par le délai de `Retry-After`
 * (« Quota Gemini atteint, réessayez dans 42 s ») ; sinon, message standard.
 */
export function regenerateErrorMessage(err: unknown): string {
  if (!(err instanceof HttpError) || err.status !== 429) return resolveErrorMessage(err);

  const detail = detailOf(err) ?? QUOTA_FALLBACK;
  const wait = err.retryAfterSeconds;
  if (wait === undefined || wait <= 0) return `${detail} Réessayez dans quelques instants.`;
  return `${detail} Réessayez dans ${wait} s.`;
}

function detailOf(err: HttpError): string | undefined {
  const body = err.body;
  if (!body || typeof body !== "object") return undefined;
  const detail = (body as Record<string, unknown>).detail;
  return typeof detail === "string" && detail.trim() ? detail.trim() : undefined;
}
