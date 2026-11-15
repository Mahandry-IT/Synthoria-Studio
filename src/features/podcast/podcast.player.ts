/** Logique pure du lecteur de podcast (sans accès au DOM : testable en environnement node). */

/** Pas des boutons « reculer / avancer » et des raccourcis flèches du lecteur. */
export const SKIP_SECONDS = 10;
/** Pas des flèches sur la forme d'onde (slider). */
export const SEEK_STEP_SECONDS = 5;
/** Nombre de barres de la forme d'onde. */
export const WAVEFORM_BAR_COUNT = 64;

/** Temps en secondes → « m:ss » ou « h:mm:ss » ; « 0:00 » si la valeur est invalide. */
export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const ss = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** Borne `t` dans `[0, duration]` ; sans durée finie, seule la borne basse s'applique. */
export function clampTime(t: number, duration: number): number {
  if (!Number.isFinite(t)) return 0;
  const lower = Math.max(0, t);
  return Number.isFinite(duration) && duration >= 0 ? Math.min(lower, duration) : lower;
}

/** Position après un saut de `delta` secondes, bornée. */
export function skipBy(current: number, delta: number, duration: number): number {
  return clampTime((Number.isFinite(current) ? current : 0) + delta, duration);
}

/** « Suivant » : saute à la fin ; sans durée connue, reste en place. */
export function jumpToEnd(current: number, duration: number): number {
  return Number.isFinite(duration) && duration > 0 ? duration : clampTime(current, duration);
}

/** Hachage FNV-1a 32 bits d'une chaîne (graine stable de la pseudo-onde). */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Générateur pseudo-aléatoire mulberry32 : même graine, mêmes valeurs. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pseudo-onde déterministe : `count` hauteurs dans [0.15, 1], dérivées de `seed` (le `jobId`). */
export function waveformBars(seed: string, count: number = WAVEFORM_BAR_COUNT): number[] {
  const n = Math.max(0, Math.floor(count));
  const rand = mulberry32(hashSeed(seed));
  return Array.from({ length: n }, () => 0.15 + rand() * 0.85);
}

/** Pics réels d'un canal audio : `count` maxima de valeur absolue, normalisés dans [0, 1]. */
export function peaksFromSamples(channelData: ArrayLike<number>, count: number = WAVEFORM_BAR_COUNT): number[] {
  const n = Math.max(0, Math.floor(count));
  if (n === 0 || channelData.length === 0) return Array.from({ length: n }, () => 0);
  const size = channelData.length / n;
  const peaks = Array.from({ length: n }, (_, i) => {
    const start = Math.floor(i * size);
    const end = Math.max(start + 1, Math.min(channelData.length, Math.floor((i + 1) * size)));
    let max = 0;
    for (let j = start; j < end && j < channelData.length; j++) max = Math.max(max, Math.abs(channelData[j]));
    return max;
  });
  const top = Math.max(...peaks);
  return top > 0 ? peaks.map((p) => p / top) : peaks;
}

/** Indice de la dernière barre lue pour `time` ; -1 si rien n'est lu ou si la durée est inconnue. */
export function activeBarIndex(time: number, duration: number, count: number): number {
  if (count <= 0 || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(time) || time <= 0) return -1;
  const ratio = Math.min(time / duration, 1);
  return Math.min(count - 1, Math.ceil(ratio * count) - 1);
}

/** Nouvelle position pour une touche du slider (flèches ±5 s, Début, Fin) ; `null` pour une autre touche. */
export function waveformKeyTarget(key: string, current: number, duration: number): number | null {
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return current + SEEK_STEP_SECONDS;
    case "ArrowLeft":
    case "ArrowDown":
      return current - SEEK_STEP_SECONDS;
    case "Home":
      return 0;
    case "End":
      return duration;
    default:
      return null;
  }
}

/** Saut en secondes pour une flèche du lecteur (∓10 s) ; `null` pour une autre touche. */
export function skipForKey(key: string): number | null {
  if (key === "ArrowLeft") return -SKIP_SECONDS;
  if (key === "ArrowRight") return SKIP_SECONDS;
  return null;
}

/** Position en secondes pour une abscisse relative (0 à 1) sur la forme d'onde. */
export function timeFromRatio(ratio: number, duration: number): number {
  if (!Number.isFinite(ratio) || !Number.isFinite(duration) || duration <= 0) return 0;
  return clampTime(Math.min(Math.max(ratio, 0), 1) * duration, duration);
}
