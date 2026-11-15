"use client";

import { type RefObject, useCallback, useEffect, useState } from "react";
import { clampTime, jumpToEnd, skipBy } from "../podcast.player";

interface PodcastPlayerState {
  playing: boolean;
  currentTime: number;
  /** Durée de l'élément audio, ou durée annoncée par le backend tant que les métadonnées ne sont pas là. */
  duration: number;
  loading: boolean;
  /** Vrai si la lecture a échoué (fichier introuvable, refus du navigateur) : le lecteur propose le téléchargement. */
  error: boolean;
}

export interface PodcastPlayerControls extends PodcastPlayerState {
  toggle: () => void;
  seek: (seconds: number) => void;
  skip: (delta: number) => void;
  previous: () => void;
  next: () => void;
}

/**
 * Pilote un `<audio>` natif (sans `controls`) : état de lecture, temps, durée, chargement, erreur.
 * Les écouteurs sont retirés au démontage.
 * @param audioRef - ref de l'élément `<audio>`
 * @param fallbackDuration - durée connue d'avance (secondes), utilisée avant `loadedmetadata`
 */
export function usePodcastPlayer(
  audioRef: RefObject<HTMLAudioElement | null>,
  fallbackDuration?: number | null,
): PodcastPlayerControls {
  const [state, setState] = useState<PodcastPlayerState>({
    playing: false,
    currentTime: 0,
    duration: Number.NaN,
    loading: false,
    error: false,
  });

  // Durée de l'élément audio si connue, sinon durée annoncée par le backend (suit la prop).
  const duration = Number.isFinite(state.duration)
    ? state.duration
    : fallbackDuration && Number.isFinite(fallbackDuration)
      ? fallbackDuration
      : Number.NaN;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const patch = (p: Partial<PodcastPlayerState>) => setState((s) => ({ ...s, ...p }));
    const syncDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) patch({ duration: audio.duration });
    };

    const handlers: Record<string, () => void> = {
      play: () => patch({ playing: true, error: false }),
      pause: () => patch({ playing: false, loading: false }),
      playing: () => patch({ playing: true, loading: false }),
      waiting: () => patch({ loading: true }),
      canplay: () => patch({ loading: false }),
      timeupdate: () => patch({ currentTime: audio.currentTime }),
      seeked: () => patch({ currentTime: audio.currentTime }),
      loadedmetadata: syncDuration,
      durationchange: syncDuration,
      ended: () => patch({ playing: false, loading: false, currentTime: Number.isFinite(audio.duration) ? audio.duration : audio.currentTime }),
      error: () => patch({ playing: false, loading: false, error: true }),
    };
    for (const [event, handler] of Object.entries(handlers)) audio.addEventListener(event, handler);
    return () => {
      for (const [event, handler] of Object.entries(handlers)) audio.removeEventListener(event, handler);
    };
  }, [audioRef]);

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const target = clampTime(seconds, duration);
      audio.currentTime = target;
      setState((s) => ({ ...s, currentTime: target }));
    },
    [audioRef, duration],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    // Rejouer après la fin (ou après « Aller à la fin ») repart du début.
    const end = Number.isFinite(audio.duration) ? audio.duration : duration;
    if (audio.ended || audio.currentTime >= end) audio.currentTime = 0;
    // play() renvoie une promesse : un refus du navigateur ou un fichier illisible doit être exposé.
    audio.play().catch((e: unknown) => {
      if (e instanceof DOMException && e.name === "AbortError") return; // interrompu par une pause : pas une erreur
      setState((s) => ({ ...s, playing: false, loading: false, error: true }));
    });
  }, [audioRef, duration]);

  const skip = useCallback((delta: number) => seek(skipBy(audioRef.current?.currentTime ?? 0, delta, duration)), [audioRef, seek, duration]);

  // Pas de chapitres dans les données : « précédent » revient toujours au début.
  const previous = useCallback(() => seek(0), [seek]);

  const next = useCallback(() => {
    const current = audioRef.current?.currentTime ?? 0;
    seek(jumpToEnd(current, duration));
  }, [audioRef, seek, duration]);

  return { ...state, duration, toggle, seek, skip, previous, next };
}
