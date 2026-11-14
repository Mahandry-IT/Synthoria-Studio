"use client";

import dynamic from "next/dynamic";
import PodcastsIcon from "@mui/icons-material/Podcasts";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CircularProgressRing } from "@/components/CircularProgressRing";
import { Skeleton } from "@/components/Skeleton";
import { useEnqueuePodcast } from "../hooks/useEnqueuePodcast";
import { useSessionPodcasts } from "../hooks/useSessionPodcasts";
import { podcastStatusMeta } from "../podcast.format";
import { displayProgress, isTerminal, stageLabel } from "../podcast.progress";
import type { PodcastStatus } from "../podcast.types";

// Le lecteur n'est chargé qu'à la demande (rien à télécharger tant qu'il n'y a pas de podcast prêt)
const PodcastPlayer = dynamic(() => import("./PodcastPlayer").then((m) => m.PodcastPlayer), {
  ssr: false,
  loading: () => <Skeleton lines={2} />,
});

interface SessionPodcastProps {
  /** Session de cours persistée côté backend. */
  sessionId: string;
}

/** Statut du job affiché en `Badge` : libellé et icône texte, jamais la couleur seule. */
function StatusBadge({ status }: { status: PodcastStatus }) {
  const meta = podcastStatusMeta(status);
  return (
    <Badge variant={meta.variant} className="ml-auto">
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </Badge>
  );
}

/**
 * Bloc « Écouter ce cours » : lecteur du dernier podcast prêt, avancement s'il est en cours de
 * génération, sinon bouton pour le générer. Utilisé dans le cours (/ask) et dans l'historique.
 */
export function SessionPodcast({ sessionId }: SessionPodcastProps) {
  const { data: jobs, isLoading } = useSessionPodcasts(sessionId);
  const enqueue = useEnqueuePodcast();

  if (isLoading || !jobs) return null;

  const ready = jobs.find((job) => job.status === "done");
  const active = jobs.find((job) => !isTerminal(job.status));
  const failed = !ready && !active && jobs[0]?.status === "failed" ? jobs[0] : null;
  const shown = ready ?? failed; // en cours : le libellé d'étape suffit

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <PodcastsIcon fontSize="small" className="text-primary" aria-hidden="true" />
        <h2 className="font-serif text-base font-semibold text-ink">Écouter ce cours</h2>
        {shown && <StatusBadge status={shown.status} />}
      </div>

      <div className="mt-3">
        {ready ? (
          <PodcastPlayer jobId={ready.job_id} durationSeconds={ready.duration_seconds} />
        ) : active ? (
          <div className="flex items-center gap-3" role="status" aria-live="polite">
            <CircularProgressRing
              value={displayProgress(active) / 100}
              size={40}
              color="var(--accent)"
              label="Progression du podcast"
            >
              <span aria-hidden="true" className="font-mono text-[10px] font-semibold text-ink-2">
                {displayProgress(active)}
              </span>
            </CircularProgressRing>
            <p className="text-sm text-ink-2">
              {stageLabel(active)} — le podcast sera disponible ici dans quelques minutes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {failed && (
              <p className="rounded-card border-l-[3px] border-err bg-err-soft p-3 text-sm text-err">
                <span aria-hidden="true">⚠ </span>
                La dernière génération a échoué{failed.error_message ? ` : ${failed.error_message}` : "."}
              </p>
            )}
            <Button
              type="button"
              variant="secondary"
              loading={enqueue.isPending}
              onClick={() => enqueue.mutate({ sessionId, options: failed ? { force: true } : undefined })}
            >
              <PodcastsIcon sx={{ fontSize: 18 }} />
              {failed ? "Réessayer le podcast" : "Générer le podcast"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
