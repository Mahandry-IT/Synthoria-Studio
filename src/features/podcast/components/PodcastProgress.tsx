"use client";

import { useEffect, useState } from "react";
import { HttpError } from "@/shared/api/httpClient";
import { usePodcastJob } from "../hooks/usePodcastJob";
import { PodcastMiniProgress } from "./PodcastMiniProgress";
import { PodcastProgressModal } from "./PodcastProgressModal";

interface PodcastProgressProps {
  jobId: string;
  /** Oublie le job suivi (job terminé, introuvable ou fermé par l'utilisateur). */
  onDismiss: () => void;
  /** Relance la génération pour la session du job en échec. */
  onRetry: (sessionId: string) => void;
  isRetrying?: boolean;
}

/**
 * Suivi d'un job de podcast : modal de progression, réductible en badge flottant.
 * C'est ici (et seulement ici) que le job est interrogé : la page et le cours ne se re-rendent
 * pas à chaque tick de progression. Se retire tout seul quand le job est terminé avec succès.
 */
export function PodcastProgress({ jobId, onDismiss, onRetry, isRetrying = false }: PodcastProgressProps) {
  const { job, progress, label, stageIndex, error } = usePodcastJob(jobId);
  const [minimized, setMinimized] = useState(false);

  const done = job?.status === "done";
  const notFound = error instanceof HttpError && error.status === 404;

  // Terminé (le lecteur prend le relais dans le cours) ou job introuvable (purgé) : on l'oublie.
  useEffect(() => {
    if (done || notFound) onDismiss();
  }, [done, notFound, onDismiss]);

  if (!job || done) return null;

  const failed = job.status === "failed";

  if (minimized && !failed) {
    return (
      <PodcastMiniProgress progress={progress} label={label} failed={false} onExpand={() => setMinimized(false)} />
    );
  }

  return (
    <PodcastProgressModal
      progress={progress}
      label={label}
      stageIndex={stageIndex}
      failed={failed}
      errorMessage={job.error_message}
      isRetrying={isRetrying}
      onMinimize={() => setMinimized(true)}
      onRetry={() => onRetry(job.course_session_id)}
      onClose={onDismiss}
    />
  );
}
