"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPodcastJob } from "../podcast.api";
import {
  displayProgress,
  isTerminal,
  monotonicJob,
  pollIntervalMs,
  stageIndex,
  stageLabel,
} from "../podcast.progress";
import type { PodcastJob } from "../podcast.types";
import { toastSuccess, toastWarning } from "@/shared/ui/toast";

/**
 * Suit un job de podcast : polling toutes les 2 s tant qu'il est actif, arrêt net dès qu'il
 * est terminé. La progression ne recule jamais. À la fin d'un job suivi depuis son démarrage,
 * un toast prévient l'utilisateur et les listes de podcasts sont invalidées (et elles seules).
 */
export function usePodcastJob(jobId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["podcast-job", jobId] as const;

  const query = useQuery({
    queryKey,
    enabled: jobId !== null,
    staleTime: 0,
    queryFn: async () => {
      const next = await getPodcastJob(jobId as string);
      return monotonicJob(queryClient.getQueryData<PodcastJob>(queryKey), next);
    },
    refetchInterval: (q) => pollIntervalMs(q.state.data),
  });

  const job = query.data ?? null;
  const wasActive = useRef(false);

  useEffect(() => {
    if (!job) return;
    if (!isTerminal(job.status)) {
      wasActive.current = true;
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["podcasts-recent"] });
    queryClient.invalidateQueries({ queryKey: ["session-podcasts", job.course_session_id] });

    // Pas de toast pour un job déjà terminé au premier relevé (ex. rechargement de la page)
    if (!wasActive.current) return;
    wasActive.current = false;
    if (job.status === "done") toastSuccess("Le podcast est prêt.");
    else toastWarning(job.error_message ?? "La génération du podcast a échoué.");
  }, [job, queryClient]);

  return {
    job,
    progress: displayProgress(job),
    label: stageLabel(job),
    stageIndex: stageIndex(job),
    isTerminal: isTerminal(job?.status),
    error: query.error,
    refetch: query.refetch,
  };
}
