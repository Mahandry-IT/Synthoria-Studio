"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PodcastsIcon from "@mui/icons-material/Podcasts";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ButtonLink } from "@/components/ButtonLink";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { SectionHeading } from "@/components/PageHeader";
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
 * Les 3 derniers podcasts : titre, date relative, durée et statut (icône + texte, jamais la
 * couleur seule). Choisir un podcast prêt le lit dans la section.
 */
export function RecentPodcastsCard() {
  const { data: podcasts, isLoading, error, refetch } = useRecentPodcasts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const now = useNow(60_000);

  if (isLoading) return <DashboardCardSkeleton label="derniers podcasts" />;
  if (error) {
    return (
      <section>
        <SectionHeading title="Derniers podcasts" />
        <div className="mt-4">
          <ErrorState error={error} onRetry={() => refetch()} />
        </div>
      </section>
    );
  }

  const items = podcasts ?? [];
  const selected = items.find((podcast) => podcast.job_id === selectedId && podcast.status === "done") ?? null;

  return (
    <section>
      <SectionHeading title="Derniers podcasts" />

      {items.length === 0 ? (
        <EmptyState className="mt-4"
          icon={<PodcastsIcon fontSize="small" />}
          title="Aucun podcast pour le moment."
          action={
            <ButtonLink href="/ask" variant="accent">
              Générer un cours
            </ButtonLink>
          }
        />
      ) : (
        <>
          <ul>
            {items.map((podcast) => {
              const meta = podcastStatusMeta(podcast.status);
              const playable = podcast.status === "done";
              const isSelected = playable && podcast.job_id === selectedId;
              const duration = formatDuration(podcast.duration_seconds);
              const title = podcast.title || "Podcast sans titre";

              return (
                <li key={podcast.job_id} className="flex items-center gap-4 border-b border-line py-4">
                  <Button
                    type="button"
                    size="icon"
                    variant={isSelected ? "primary" : "secondary"}
                    disabled={!playable}
                    aria-pressed={playable ? isSelected : undefined}
                    aria-label={`Écouter ${title}`}
                    onClick={() => setSelectedId(isSelected ? null : podcast.job_id)}
                    className="shrink-0 rounded-full"
                  >
                    <PlayArrowIcon fontSize="small" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-serif text-[17px] leading-snug font-medium text-ink">{title}</p>
                    <p className="mt-0.5 text-xs text-ink-2">{formatRelativeDate(podcast.created_at, now)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {duration && <span className="font-mono text-xs text-ink-2">{duration}</span>}
                    <Badge variant={meta.variant} className="gap-1">
                      <span aria-hidden="true">{meta.icon}</span>
                      {isTerminal(podcast.status) ? meta.label : `${meta.label} ${displayProgress(podcast)} %`}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>

          {selected ? (
            <div className="mt-4">
              <PodcastPlayer
                key={selected.job_id}
                jobId={selected.job_id}
                title={selected.title}
                durationSeconds={selected.duration_seconds}
              />
            </div>
          ) : (
            items.some((p) => p.status === "done") && (
              <p className="mt-3 text-xs text-ink-2">Sélectionnez un podcast prêt pour l&apos;écouter ici.</p>
            )
          )}
        </>
      )}
    </section>
  );
}
