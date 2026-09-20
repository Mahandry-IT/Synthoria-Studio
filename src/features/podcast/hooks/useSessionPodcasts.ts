"use client";

import { useQuery } from "@tanstack/react-query";
import { getSessionPodcasts } from "../podcast.api";
import { POLL_INTERVAL_MS, isTerminal } from "../podcast.progress";

/**
 * Jobs podcast d'une session de cours (plus récent d'abord). Le polling ne tourne que tant
 * qu'un job est actif ; il s'arrête dès que tous sont terminés.
 */
export function useSessionPodcasts(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: ["session-podcasts", sessionId],
    enabled: !!sessionId,
    staleTime: 0,
    queryFn: () => getSessionPodcasts(sessionId as string),
    refetchInterval: (q) => (q.state.data?.some((job) => !isTerminal(job.status)) ? POLL_INTERVAL_MS : false),
  });
}
