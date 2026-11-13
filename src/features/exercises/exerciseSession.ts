/** Id DOM du titre de l'énoncé (cible du focus après « Commencer »). */
export const EXERCISE_TITLE_ID = "exercise-title";
/** Id DOM du titre de la carte « avant » (cible du focus après « Refaire »). */
export const EXERCISE_BEFORE_TITLE_ID = "exercise-before-title";

/** Le détail (énoncé, indices) n'est demandé qu'après « Commencer » (RG-8). */
export function isDetailFetchEnabled(started: boolean, sessionId: string, exerciseId: string): boolean {
  return started && sessionId.length > 0 && exerciseId.length > 0;
}
