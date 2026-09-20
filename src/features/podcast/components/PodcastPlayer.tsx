"use client";

import { formatDuration } from "../podcast.format";
import { podcastAudioUrl, podcastTranscriptUrl } from "../podcast.api";

interface PodcastPlayerProps {
  /** UUID d'un job terminé (validé à la construction des URLs). */
  jobId: string;
  title?: string;
  durationSeconds?: number | null;
}

/**
 * Lecteur audio d'un podcast terminé : contrôles natifs (clavier, seek via Range), sous-titres
 * WebVTT et téléchargement. `preload="none"` : rien n'est téléchargé avant la lecture.
 * Le titre est affiché en texte brut (il vient du contenu de l'utilisateur / du web).
 */
export function PodcastPlayer({ jobId, title, durationSeconds }: PodcastPlayerProps) {
  const audioUrl = podcastAudioUrl(jobId);
  const duration = formatDuration(durationSeconds);

  return (
    <div className="space-y-2">
      {(title || duration) && (
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-gray-700">
          {title && <span className="line-clamp-2 font-medium">{title}</span>}
          {duration && <span className="text-xs text-gray-500">Durée : {duration}</span>}
        </p>
      )}

      <audio
        controls
        preload="none"
        src={audioUrl}
        aria-label={title ? `Podcast : ${title}` : "Podcast du cours"}
        className="w-full"
      >
        <track kind="captions" src={podcastTranscriptUrl(jobId)} srcLang="fr" label="Français" default />
        Votre navigateur ne sait pas lire l&apos;audio.{" "}
        <a href={audioUrl} download>
          Télécharger le podcast
        </a>
      </audio>

      <a
        href={audioUrl}
        download
        className="inline-block text-xs font-medium text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
      >
        Télécharger l&apos;audio
      </a>
    </div>
  );
}
