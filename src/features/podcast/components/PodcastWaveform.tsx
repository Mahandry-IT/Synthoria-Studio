"use client";

import { type KeyboardEvent, type PointerEvent, memo, useRef } from "react";
import { cx } from "@/shared/utils/cx";
import { activeBarIndex, formatClock, timeFromRatio, waveformKeyTarget } from "../podcast.player";

interface PodcastWaveformProps {
  /** Hauteurs des barres, entre 0 et 1. */
  bars: number[];
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  label: string;
}

/** Délai minimal entre deux positionnements pendant un glissement (ms). */
const DRAG_SEEK_INTERVAL_MS = 120;

/** Barres mémorisées : un tick de lecture qui ne change pas la barre active ne les redessine pas. */
const WaveformBars = memo(function WaveformBars({ bars, active }: { bars: number[]; active: number }) {
  return bars.map((height, i) => (
    <span
      key={i}
      aria-hidden="true"
      style={{ height: `${Math.round(height * 100)}%` }}
      className={cx(
        "min-w-px flex-1 rounded-full transition-colors duration-(--d-fast) motion-reduce:transition-none",
        i <= active ? "bg-ink" : "bg-ink-3",
      )}
    />
  ));
});

/**
 * Forme d'onde cliquable : un `slider` (clic, glissement, flèches ±5 s, Début/Fin).
 * Barres lues en `ink`, reste en `ink-3`. Les barres sont décoratives (`aria-hidden`).
 */
export function PodcastWaveform({ bars, currentTime, duration, onSeek, label }: PodcastWaveformProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastSeekAt = useRef(0);
  const known = Number.isFinite(duration) && duration > 0;
  const active = activeBarIndex(currentTime, duration, bars.length);

  const seekFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!known || !rect || rect.width === 0) return;
    onSeek(timeFromRatio((e.clientX - rect.left) / rect.width, duration));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!known) return;
    const target = waveformKeyTarget(e.key, currentTime, duration);
    if (target === null) return;
    e.preventDefault();
    e.stopPropagation(); // les flèches du conteneur (±10 s) ne doivent pas se cumuler
    onSeek(target);
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={known ? 0 : -1}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={known ? Math.floor(duration) : 0}
      aria-valuenow={known ? Math.floor(currentTime) : 0}
      aria-valuetext={known ? `${formatClock(currentTime)} sur ${formatClock(duration)}` : "Durée inconnue"}
      aria-disabled={!known}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        seekFromPointer(e);
      }}
      onPointerMove={(e) => {
        // Limite les positionnements (requêtes Range) pendant le glissement ; le relâchement fait le dernier.
        const now = performance.now();
        if (!dragging.current || now - lastSeekAt.current < DRAG_SEEK_INTERVAL_MS) return;
        lastSeekAt.current = now;
        seekFromPointer(e);
      }}
      onPointerUp={(e) => {
        if (dragging.current) seekFromPointer(e);
        dragging.current = false;
      }}
      onPointerCancel={() => (dragging.current = false)}
      className={cx(
        "flex h-12 min-w-0 flex-1 touch-pan-y items-center gap-px rounded-ctrl",
        known ? "cursor-pointer" : "cursor-default opacity-60",
      )}
    >
      <WaveformBars bars={bars} active={active} />
    </div>
  );
}
