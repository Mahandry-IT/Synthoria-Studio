"use client";

import { CircularProgressRing } from "@/components/CircularProgressRing";

interface CircularTimerProps {
  timeLeft: number;
  totalTime: number;
}

/**
 * Cercle progressif affichant le temps restant.
 * - Se vide proportionnellement au temps écoulé.
 * - Passe en ton `err` (token) quand timeLeft < 10s ; le texte masqué du `role="timer"` porte le sens.
 * - Affiche le temps au centre (mm:ss ou ss).
 */
export function CircularTimer({ timeLeft, totalTime }: CircularTimerProps) {
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const isUrgent = timeLeft < 10;

  const display =
    timeLeft >= 60
      ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
      : String(timeLeft);

  return (
    <CircularProgressRing
      value={progress}
      role="timer"
      label={`${timeLeft} secondes restantes`}
      color={isUrgent ? "var(--err)" : "var(--accent)"}
    >
      <span
        className={`font-mono text-[11px] font-semibold ${isUrgent ? "text-err" : "text-ink-2"}`}
      >
        {display}
      </span>
    </CircularProgressRing>
  );
}
