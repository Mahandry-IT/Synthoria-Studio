const MS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;

/** Durée prévue en secondes ; `null` si l'exercice n'a pas de durée exploitable (pas de minuteur). */
export function durationSeconds(durationMinutes: number | null | undefined): number | null {
  if (typeof durationMinutes !== "number" || !Number.isFinite(durationMinutes) || durationMinutes <= 0) return null;
  return Math.round(durationMinutes * SECONDS_PER_MINUTE);
}

/**
 * Secondes restantes, arrondies au-dessus (00:01 jusqu'à la toute fin), jamais négatives.
 * Une horloge qui recule (now < start) donne au plus la durée complète.
 */
export function remainingSeconds(startedAtMs: number, nowMs: number, totalSeconds: number): number {
  const elapsedMs = Math.max(0, nowMs - startedAtMs);
  return Math.max(0, Math.ceil(totalSeconds - elapsedMs / MS_PER_SECOND));
}

/** Format « mm:ss » ; au-delà de 99 minutes les minutes s'allongent (« 100:00 »). */
export function formatMmSs(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const minutes = Math.floor(safe / SECONDS_PER_MINUTE);
  const rest = safe % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/** Temps écoulé : le décompte est arrivé à zéro (la saisie reste possible). */
export function isTimeUp(remaining: number): boolean {
  return remaining <= 0;
}

export interface CountdownOptions {
  /** Départ, dans la même horloge que `now` (monotone : `performance.now()`). */
  startedAtMs: number;
  totalSeconds: number;
  now: () => number;
  onTick: (remainingSeconds: number) => void;
}

const TICK_MS = 1_000;

/**
 * Lance le décompte : `onTick` reçoit les secondes restantes chaque seconde, puis l'intervalle
 * s'arrête de lui-même à zéro. Renvoie la fonction d'arrêt (nettoyage au démontage ou à la correction).
 */
export function startCountdown({ startedAtMs, totalSeconds, now, onTick }: CountdownOptions): () => void {
  const id = setInterval(() => {
    const remaining = remainingSeconds(startedAtMs, now(), totalSeconds);
    onTick(remaining);
    if (isTimeUp(remaining)) clearInterval(id);
  }, TICK_MS);
  return () => clearInterval(id);
}
