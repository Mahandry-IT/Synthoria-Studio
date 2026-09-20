"use client";

import { useCallback } from "react";
import { uuidSchema } from "../podcast.schema";
import type { PodcastGenerationOptions } from "../podcast.types";
import { useEnqueuePodcast } from "./useEnqueuePodcast";
import { useSessionStorageState } from "@/shared/hooks/useSessionStorageState";

const PODCAST_JOB_STORAGE_KEY = "synthoria:podcast-job";

/**
 * Orchestre le podcast enchaîné après un cours : lance (ou suit) un job et mémorise son id en
 * sessionStorage pour survivre à un rechargement. Ne lit PAS l'état du job : le suivi (polling,
 * progression) est isolé dans `PodcastProgress`, pour que la page et le cours ne se re-rendent
 * pas à chaque tick.
 */
export function usePodcastGeneration() {
  const [jobId, setJobId] = useSessionStorageState<string>(PODCAST_JOB_STORAGE_KEY, null);
  const enqueue = useEnqueuePodcast((response) => setJobId(response.job_id));
  const { mutate, isPending } = enqueue;

  /** Lance la génération pour une session (sans effet tant qu'une demande est en cours). */
  const start = useCallback(
    (sessionId: string, options?: PodcastGenerationOptions) => {
      if (isPending) return;
      mutate({ sessionId, options });
    },
    [isPending, mutate],
  );

  /** Suit un job déjà créé par le backend (génération automatique après le cours). */
  const follow = useCallback(
    (id: string) => {
      if (uuidSchema.safeParse(id).success) setJobId(id);
    },
    [setJobId],
  );

  const dismiss = useCallback(() => setJobId(null), [setJobId]);

  return { jobId, isEnqueuing: isPending, start, follow, dismiss };
}
