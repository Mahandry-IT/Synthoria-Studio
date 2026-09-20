"use client";

import { useQuery } from "@tanstack/react-query";
import { getRecentPodcasts } from "@/features/podcast/podcast.api";
import { POLL_INTERVAL_MS, isTerminal } from "@/features/podcast/podcast.progress";
import { RECENT_PODCASTS_COUNT, pickRecent } from "../dashboard.logic";

/**
 * Les podcasts les plus récents (3 par défaut). Rafraîchi toutes les 2 s tant qu'un d'eux est
 * en cours de génération, puis plus du tout ; invalidé par `["podcasts-recent"]` à la fin d'un job.
 */
export function useRecentPodcasts(limit: number = RECENT_PODCASTS_COUNT) {
  return useQuery({
    queryKey: ["podcasts-recent", limit],
    queryFn: async () => pickRecent(await getRecentPodcasts(limit), limit),
    refetchInterval: (q) => (q.state.data?.some((podcast) => !isTerminal(podcast.status)) ? POLL_INTERVAL_MS : false),
  });
}
