import type { PodcastJob, PodcastStage, PodcastStatus } from "./podcast.types";

/** Étapes actives du pipeline, dans l'ordre (source unique pour le modal et le dashboard). */
export const PODCAST_STAGES: readonly PodcastStage[] = ["scripting", "synthesizing", "mixing"];

const STAGE_LABELS: Record<PodcastStage, string> = {
  scripting: "Écriture du script",
  synthesizing: "Synthèse des voix",
  mixing: "Montage audio",
};

/** Intervalle de polling d'un job actif. */
export const POLL_INTERVAL_MS = 2_000;

const isStage = (value: string): value is PodcastStage => (PODCAST_STAGES as readonly string[]).includes(value);

/** Libellé français de l'étape en cours (retombe sur l'état du job, puis sur un libellé neutre). */
export function stageLabel(job: Pick<PodcastJob, "stage" | "status"> | null | undefined): string {
  if (!job) return "Préparation du podcast";
  if (job.status === "done") return "Podcast prêt";
  if (job.status === "failed") return "La génération a échoué";
  if (job.stage && isStage(job.stage)) return STAGE_LABELS[job.stage];
  if (isStage(job.status)) return STAGE_LABELS[job.status];
  return "En attente de démarrage";
}

/** Index (0-based) de l'étape en cours, -1 si le job n'a pas commencé. */
export function stageIndex(job: Pick<PodcastJob, "stage" | "status"> | null | undefined): number {
  if (!job) return -1;
  if (job.status === "done") return PODCAST_STAGES.length;
  const current = job.stage && isStage(job.stage) ? job.stage : isStage(job.status) ? job.status : null;
  return current ? PODCAST_STAGES.indexOf(current) : -1;
}

/** `done` et `failed` : le job n'évoluera plus. */
export function isTerminal(status: PodcastStatus | null | undefined): boolean {
  return status === "done" || status === "failed";
}

/** Progression affichable : entier borné à 0-100, 100 dès que le job est terminé avec succès. */
export function displayProgress(job: Pick<PodcastJob, "progress" | "status"> | null | undefined): number {
  if (!job) return 0;
  if (job.status === "done") return 100;
  if (!Number.isFinite(job.progress)) return 0;
  return Math.min(100, Math.max(0, Math.round(job.progress)));
}

/**
 * Empêche la barre de reculer entre deux relevés (ex. reprise d'une étape par le worker) :
 * garde la progression précédente si elle est supérieure, sauf sur un job terminé.
 */
export function monotonicJob(previous: PodcastJob | undefined, next: PodcastJob): PodcastJob {
  if (!previous || previous.job_id !== next.job_id || isTerminal(next.status)) return next;
  return next.progress < previous.progress ? { ...next, progress: previous.progress } : next;
}

/** Intervalle de polling : `false` (arrêt) sur un job terminé, sinon `POLL_INTERVAL_MS`. */
export function pollIntervalMs(job: Pick<PodcastJob, "status"> | null | undefined): number | false {
  return job && isTerminal(job.status) ? false : POLL_INTERVAL_MS;
}
