"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import PodcastsIcon from "@mui/icons-material/Podcasts";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { formatDuration, podcastStatusMeta } from "@/features/podcast/podcast.format";
import { displayProgress, isTerminal } from "@/features/podcast/podcast.progress";
import { useNow } from "@/shared/hooks/useNow";
import { formatRelativeDate } from "../dashboard.logic";
import { useRecentPodcasts } from "../hooks/useRecentPodcasts";
import { DashboardCardSkeleton } from "./DashboardCardSkeleton";

// Un seul lecteur, chargé à la demande : le dashboard reste léger tant qu'on n'écoute rien
const PodcastPlayer = dynamic(
  () => import("@/features/podcast/components/PodcastPlayer").then((m) => m.PodcastPlayer),
  { ssr: false, loading: () => <Skeleton lines={2} /> },
);

/**
 * Une seule carte pour les 3 derniers podcasts : titre, date relative, durée et statut
 * (icône + texte, jamais la couleur seule). Choisir un podcast prêt le lit dans la carte.
 */
export function RecentPodcastsCard() {
  const { data: podcasts, isLoading, error, refetch } = useRecentPodcasts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const now = useNow(60_000);

  if (isLoading) return <DashboardCardSkeleton label="derniers podcasts" />;
  if (error) {
    return (
      <Card className="p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Derniers podcasts</h2>
        <ErrorState error={error} onRetry={() => refetch()} />
      </Card>
    );
  }

  const items = podcasts ?? [];
  const selected = items.find((podcast) => podcast.job_id === selectedId && podcast.status === "done") ?? null;

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <PodcastsIcon fontSize="small" className="text-indigo-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-gray-900">Derniers podcasts</h2>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
          <p className="text-sm text-gray-600">Aucun podcast pour le moment.</p>
          <Link
            href="/ask"
            className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Générer un cours
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-1">
            {items.map((podcast) => {
              const meta = podcastStatusMeta(podcast.status);
              const playable = podcast.status === "done";
              const isSelected = playable && podcast.job_id === selectedId;
              const duration = formatDuration(podcast.duration_seconds);

              return (
                <li key={podcast.job_id}>
                  <button
                    type="button"
                    disabled={!playable}
                    aria-pressed={playable ? isSelected : undefined}
                    onClick={() => setSelectedId(isSelected ? null : podcast.job_id)}
                    className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                      isSelected ? "bg-indigo-50" : playable ? "hover:bg-gray-50" : "cursor-default"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm font-medium text-gray-900">
                        {podcast.title || "Podcast sans titre"}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {formatRelativeDate(podcast.created_at, now)}
                        {duration && ` · ${duration}`}
                      </span>
                    </span>
                    <Badge variant={meta.variant} className="shrink-0 gap-1">
                      <span aria-hidden="true">{meta.icon}</span>
                      {isTerminal(podcast.status) ? meta.label : `${meta.label} ${displayProgress(podcast)} %`}
                    </Badge>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected ? (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <PodcastPlayer
                key={selected.job_id}
                jobId={selected.job_id}
                title={selected.title}
                durationSeconds={selected.duration_seconds}
              />
            </div>
          ) : (
            items.some((p) => p.status === "done") && (
              <p className="mt-3 text-xs text-gray-500">Sélectionnez un podcast prêt pour l&apos;écouter ici.</p>
            )
          )}
        </>
      )}
    </Card>
  );
}
