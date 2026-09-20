import { getJson, postJson } from "@/shared/api/httpClient";
import {
  podcastEnqueueResponseSchema,
  podcastGenerationOptionsSchema,
  podcastJobListSchema,
  podcastJobSchema,
  podcastSummaryListSchema,
  uuidSchema,
} from "./podcast.schema";
import type {
  PodcastEnqueueResponse,
  PodcastGenerationOptions,
  PodcastJob,
  PodcastSummary,
} from "./podcast.types";

/** Valide un identifiant avant de l'insérer dans une URL (jamais de chaîne libre dans un chemin). */
function assertUuid(value: string, what: string): string {
  const parsed = uuidSchema.safeParse(value);
  if (!parsed.success) throw new Error(`Identifiant de ${what} invalide.`);
  return parsed.data;
}

/** Valide une réponse backend ; en cas d'écart, log technique + message utilisateur clair. */
function parseOrThrow<T>(
  schema: { safeParse: (raw: unknown) => { success: true; data: T } | { success: false; error: unknown } },
  raw: unknown,
  message: string,
): T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    console.error(`Zod validation failed (${message}):`, parsed.error);
    throw new Error(message);
  }
  return parsed.data;
}

/**
 * Met en file la génération d'un podcast (le backend répond 202 immédiatement) ;
 * l'avancement se suit ensuite avec `getPodcastJob`.
 *
 * @throws {HttpError} 404 session inconnue, 422 cours sans contenu, 429 trop de demandes, 503 désactivé
 */
export async function enqueuePodcast(
  sessionId: string,
  options?: PodcastGenerationOptions,
): Promise<PodcastEnqueueResponse> {
  const id = assertUuid(sessionId, "session");
  const body = options ? podcastGenerationOptionsSchema.parse(options) : undefined;

  const raw = await postJson<unknown>(`/podcasts/generate/${id}`, body, { noRetry: true });
  return parseOrThrow(podcastEnqueueResponseSchema, raw, "Réponse invalide du serveur pour le podcast.");
}

/** État d'un job de podcast (polling). */
export async function getPodcastJob(jobId: string): Promise<PodcastJob> {
  const raw = await getJson<unknown>(`/podcasts/jobs/${assertUuid(jobId, "podcast")}`);
  return parseOrThrow(podcastJobSchema, raw, "Réponse invalide du serveur pour l'état du podcast.");
}

/** Podcasts les plus récents (tous statuts), du plus récent au plus ancien. */
export async function getRecentPodcasts(limit: number): Promise<PodcastSummary[]> {
  const raw = await getJson<unknown>("/podcasts", { params: { limit } });
  return parseOrThrow(podcastSummaryListSchema, raw, "Réponse invalide du serveur pour les podcasts.").data;
}

/** Jobs podcast d'une session de cours, du plus récent au plus ancien. */
export async function getSessionPodcasts(sessionId: string): Promise<PodcastJob[]> {
  const raw = await getJson<unknown>(`/courses/history/${assertUuid(sessionId, "session")}/podcasts`);
  return parseOrThrow(podcastJobListSchema, raw, "Réponse invalide du serveur pour les podcasts du cours.").data;
}

/** URL relative (via le rewrite Next) de l'audio d'un podcast terminé. */
export function podcastAudioUrl(jobId: string): string {
  return `/api/podcasts/${assertUuid(jobId, "podcast")}/audio`;
}

/** URL relative de la transcription WebVTT d'un podcast terminé. */
export function podcastTranscriptUrl(jobId: string): string {
  return `/api/podcasts/${assertUuid(jobId, "podcast")}/transcript`;
}
