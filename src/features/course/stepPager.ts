/** Logique pure de la pagination des étapes du lecteur de cours (sans DOM). */

/** Distance horizontale minimale (px) pour qu'un geste compte comme un balayage. */
export const SWIPE_THRESHOLD = 48;

/** Sens du glissement de l'étape qui apparaît. */
export type SlideDirection = "next" | "prev";

/** Borne l'index affiché (0-based) dans `[0, revealed - 1]` ; 0 si rien n'est dévoilé. */
export function clampStep(index: number, revealed: number): number {
  const last = Math.max(0, Math.floor(revealed) - 1);
  if (!Number.isFinite(index)) return last;
  return Math.min(last, Math.max(0, Math.floor(index)));
}

/**
 * Index cible pour une touche de navigation : flèches gauche/droite, Début, Fin.
 * Pas de boucle (on s'arrête aux bornes) ; `null` pour toute autre touche.
 */
export function stepForKey(current: number, key: string, revealed: number): number | null {
  switch (key) {
    case "ArrowLeft":
      return clampStep(current - 1, revealed);
    case "ArrowRight":
      return clampStep(current + 1, revealed);
    case "Home":
      return 0;
    case "End":
      return clampStep(revealed - 1, revealed);
    default:
      return null;
  }
}

/**
 * Sens d'un balayage : `1` (vers la gauche, étape suivante), `-1` (vers la droite, étape
 * précédente), `null` si le geste est trop court ou surtout vertical (défilement de la page).
 */
export function swipeDirection(dx: number, dy: number, threshold: number = SWIPE_THRESHOLD): 1 | -1 | null {
  if (Math.abs(dy) > Math.abs(dx)) return null;
  if (Math.abs(dx) < threshold) return null;
  return dx < 0 ? 1 : -1;
}

/** Compteur visible, 1-based : « 2 / 5 ». */
export function pagerCounter(current: number, total: number): string {
  return `${current + 1} / ${total}`;
}

/** Annonce pour lecteur d'écran : « Étape 2 sur 5 : Pourquoi » (titre omis s'il est vide). */
export function pagerLabel(current: number, total: number, title?: string, unit = "Étape"): string {
  const base = `${unit} ${current + 1} sur ${total}`;
  const clean = title?.trim();
  return clean ? `${base} : ${clean}` : base;
}

/** État d'affichage d'un lecteur à étapes : étape choisie, sens du glissement, étapes déjà affichées. */
export interface PagerState {
  /** Étape choisie par les flèches ; `null` : on suit la dernière étape dévoilée. */
  pick: number | null;
  direction: SlideDirection | null;
  /** Étapes déjà affichées au moins une fois : leur contenu reste monté (le reste n'est monté qu'à la première visite). */
  seen: number[];
}

export const INITIAL_PAGER_STATE: PagerState = { pick: null, direction: null, seen: [] };

function withSeen(seen: number[], ...indexes: number[]): number[] {
  return [...new Set([...seen, ...indexes])];
}

/** Affiche l'étape `index` depuis l'étape `from`. */
export function goToState(state: PagerState, index: number, from: number): PagerState {
  return { pick: index, direction: index > from ? "next" : "prev", seen: withSeen(state.seen, from, index) };
}

/** Une étape vient d'être débloquée : on la suit (l'étape quittée `from` reste montée). */
export function followLatestState(state: PagerState, from: number): PagerState {
  return { pick: null, direction: "next", seen: withSeen(state.seen, from) };
}

/** Le contenu d'une étape n'est monté que s'il est affiché ou l'a déjà été (pas de rendu en `display: none`). */
export function isStepMounted(state: PagerState, index: number, shown: number): boolean {
  return index === shown || state.seen.includes(index);
}
