"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import ForwardIcon from "@mui/icons-material/Forward10";
import PauseIcon from "@mui/icons-material/Pause";
import PlayIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay10";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import { Button } from "@/components/Button";
import { formatDuration } from "../podcast.format";
import { podcastAudioUrl, podcastTranscriptUrl } from "../podcast.api";
import { SKIP_SECONDS, WAVEFORM_BAR_COUNT, formatClock, skipForKey } from "../podcast.player";
import { usePodcastPeaks } from "../hooks/usePodcastPeaks";
import { usePodcastPlayer } from "../hooks/usePodcastPlayer";
import { PodcastWaveform } from "./PodcastWaveform";

interface PodcastPlayerProps {
  /** UUID d'un job terminé (validé à la construction des URLs). */
  jobId: string;
  title?: string;
  durationSeconds?: number | null;
}

const DOWNLOAD_LINK_CLASS =
  "inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-2 hover:text-ink";

/**
 * Lecteur audio d'un podcast terminé : `<audio>` natif sans contrôles natifs, piloté par
 * `usePodcastPlayer`, avec forme d'onde cliquable, ±10 s, précédent/suivant, sous-titres WebVTT
 * et téléchargement. `preload="none"` : rien n'est téléchargé avant la lecture (le décodage de la
 * forme d'onde démarre aussi au premier appui sur lecture). Titre rendu en texte brut.
 * Raccourcis : espace = lecture/pause, flèches gauche/droite = ∓10 s.
 */
export function PodcastPlayer({ jobId, title, durationSeconds }: PodcastPlayerProps) {
  const audioUrl = podcastAudioUrl(jobId);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [started, setStarted] = useState(false);
  const [buffered, setBuffered] = useState(false);
  const player = usePodcastPlayer(audioRef, durationSeconds);
  const bars = usePodcastPeaks(jobId, audioUrl, WAVEFORM_BAR_COUNT, started && buffered);
  const duration = formatDuration(durationSeconds);

  const toggle = () => {
    setStarted(true);
    player.toggle();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Les contrôles natifs (boutons, liens) et le slider gardent leurs propres touches.
    if ((e.target as HTMLElement).closest("button, a")) return;
    if (e.key === " ") {
      e.preventDefault();
      toggle();
    } else {
      const delta = skipForKey(e.key);
      if (delta === null) return;
      e.preventDefault();
      player.skip(delta);
    }
  };

  return (
    <div
      role="group"
      aria-label={title ? `Lecteur du podcast : ${title}` : "Lecteur du podcast du cours"}
      onKeyDown={onKeyDown}
      className="space-y-3 rounded-card border border-line bg-sunken p-4"
    >
      {(title || duration) && (
        <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          {title && <span className="line-clamp-2 font-serif text-base font-medium text-ink">{title}</span>}
          {duration && <span className="font-mono text-xs text-ink-2">Durée : {duration}</span>}
        </p>
      )}

      <audio
        ref={audioRef}
        preload="none"
        src={audioUrl}
        onCanPlayThrough={() => setBuffered(true)}
        aria-label={title ? `Podcast : ${title}` : "Podcast du cours"}
      >
        <track kind="captions" src={podcastTranscriptUrl(jobId)} srcLang="fr" label="Français" default />
      </audio>

      <div className="flex items-center gap-3">
        <span className="w-12 shrink-0 text-right font-mono text-xs text-ink-2 tabular-nums">
          {formatClock(player.currentTime)}
        </span>
        <PodcastWaveform
          bars={bars}
          currentTime={player.currentTime}
          duration={player.duration}
          onSeek={player.seek}
          label="Position de lecture"
        />
        <span className="w-12 shrink-0 font-mono text-xs text-ink-2 tabular-nums">
          {Number.isFinite(player.duration) ? formatClock(player.duration) : "--:--"}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1 sm:gap-2" aria-busy={player.loading}>
        <Button variant="ghost" size="icon" aria-label="Reculer de 10 secondes" onClick={() => player.skip(-SKIP_SECONDS)}>
          <ReplayIcon />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Revenir au début" onClick={player.previous}>
          <SkipPreviousIcon />
        </Button>
        <Button
          variant="primary"
          size="icon"
          aria-label={player.playing ? "Mettre en pause" : "Lire"}
          onClick={toggle}
          className="rounded-full"
        >
          {player.playing ? <PauseIcon /> : <PlayIcon />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Aller à la fin" onClick={player.next}>
          <SkipNextIcon />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Avancer de 10 secondes" onClick={() => player.skip(SKIP_SECONDS)}>
          <ForwardIcon />
        </Button>
      </div>

      {player.error ? (
        <p role="alert" className="text-sm text-err">
          Impossible de lire ce podcast ici.{" "}
          <a href={audioUrl} download className="font-medium underline underline-offset-2">
            Télécharger l&apos;audio
          </a>
        </p>
      ) : (
        <a href={audioUrl} download className={DOWNLOAD_LINK_CLASS}>
          Télécharger l&apos;audio
        </a>
      )}
    </div>
  );
}
