"use client";

import { useEffect, useState } from "react";
import { durationSeconds, formatMmSs, isTimeUp, remainingSeconds, startCountdown } from "../exerciseTimer";

interface ExerciseTimerProps {
  /** Horloge monotone : `performance.now()` au moment où l'énoncé s'affiche. */
  startedAt: number;
  durationMinutes: number | null;
  /** Correction reçue : le minuteur s'arrête. */
  stopped?: boolean;
}

/**
 * Décompte visible pendant l'exercice. `role="timer"` sans annonce à chaque seconde (aria-live off) ;
 * à zéro, un message « Temps écoulé » est annoncé une fois, la saisie n'est jamais bloquée.
 */
export function ExerciseTimer({ startedAt, durationMinutes, stopped = false }: ExerciseTimerProps) {
  const total = durationSeconds(durationMinutes);
  const [remaining, setRemaining] = useState(() =>
    total === null ? null : remainingSeconds(startedAt, performance.now(), total),
  );
  const finished = remaining !== null && isTimeUp(remaining);

  useEffect(() => {
    if (total === null || stopped) return;
    return startCountdown({ startedAtMs: startedAt, totalSeconds: total, now: () => performance.now(), onTick: setRemaining });
  }, [startedAt, total, stopped]);

  if (remaining === null) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="timer"
        aria-live="off"
        aria-label="Temps restant"
        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 font-mono text-lg tabular-nums text-gray-900"
      >
        {formatMmSs(remaining)}
      </div>
      {finished && !stopped && (
        <p role="status" className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900">
          Temps écoulé : vous pouvez continuer et envoyer votre réponse.
        </p>
      )}
    </div>
  );
}
