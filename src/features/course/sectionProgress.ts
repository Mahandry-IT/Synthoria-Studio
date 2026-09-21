/** Progression de l'apprenant dans un cours : défis relevés (explication déverrouillée) et sections terminées. */
export interface SectionProgress {
  unlocked: string[];
  done: string[];
}

export const EMPTY_PROGRESS: SectionProgress = { unlocked: [], done: [] };

const add = (list: string[], id: string): string[] => (list.includes(id) ? list : [...list, id]);

/** Clé de progression d'une section : son id, à défaut sa position. */
export const sectionKey = (id: string | undefined, index: number): string => id ?? `#${index}`;

export function unlockSection(progress: SectionProgress, id: string): SectionProgress {
  return { ...progress, unlocked: add(progress.unlocked, id) };
}

/** Une section terminée est aussi déverrouillée (le « Vérifie » suppose que l'explication a été lue). */
export function completeSection(progress: SectionProgress, id: string): SectionProgress {
  return { unlocked: add(progress.unlocked, id), done: add(progress.done, id) };
}

/** Explication visible : section sans défi, défi relevé, ou section déjà terminée. */
export function isExplanationVisible(progress: SectionProgress, id: string, hasChallenge: boolean): boolean {
  return !hasChallenge || progress.unlocked.includes(id) || progress.done.includes(id);
}

/** Une section est « terminée » quand son Vérifie est fait ; sans questions de vérification, on ne la suit pas. */
export function isTrackable(checkQuestionsCount: number): boolean {
  return checkQuestionsCount > 0;
}
