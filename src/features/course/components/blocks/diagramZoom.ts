export const ZOOM_MIN = 50;
export const ZOOM_MAX = 300;
export const ZOOM_STEP = 25;
export const ZOOM_DEFAULT = 100;

/** Borne le zoom (%) à [ZOOM_MIN, ZOOM_MAX] ; valeur non finie → zoom par défaut. */
export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return ZOOM_DEFAULT;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

/** Zoom suivant (direction ±1) : un pas de ZOOM_STEP, borné. */
export function nextZoom(current: number, direction: 1 | -1): number {
  return clampZoom(clampZoom(current) + direction * ZOOM_STEP);
}
