/** États d'un job de génération de podcast (dans l'ordre du pipeline). */
export type PodcastStatus = "pending" | "scripting" | "synthesizing" | "mixing" | "done" | "failed";

/** Étapes actives du pipeline, dans l'ordre. */
export type PodcastStage = "scripting" | "synthesizing" | "mixing";

export type PodcastStyle = "conversational" | "educational" | "concise";

/** Réponse de GET /podcasts/jobs/{job_id} (et éléments de GET /courses/history/{id}/podcasts). */
export interface PodcastJob {
  job_id: string;
  course_session_id: string;
  status: PodcastStatus;
  /** Étape en cours côté worker ; peut être absente (job en attente, terminé). */
  stage: string | null;
  /** 0-100 */
  progress: number;
  error_message: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

/** Élément de GET /podcasts : un job et le titre affichable du podcast. */
export interface PodcastSummary extends PodcastJob {
  title: string;
}

/** Corps facultatif de POST /podcasts/generate/{session_id}. */
export interface PodcastGenerationOptions {
  style?: PodcastStyle;
  target_minutes?: number;
  /** Relance même si un job équivalent non échoué existe. */
  force?: boolean;
}

/** Réponse (202) de POST /podcasts/generate/{session_id}. */
export interface PodcastEnqueueResponse {
  job_id: string;
  status: PodcastStatus;
}
