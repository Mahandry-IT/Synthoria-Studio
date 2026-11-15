import { createStoredValue } from "@/shared/utils/storedValue";

export const COURSE_TABS = [
  { id: "lessons", label: "Leçons" },
  { id: "exercises", label: "Exercices corrigés" },
  { id: "quiz", label: "Quiz" },
] as const;

export type CourseTabId = (typeof COURSE_TABS)[number]["id"];

export const DEFAULT_COURSE_TAB: CourseTabId = "lessons";
export const COURSE_TAB_STORAGE_KEY = "synthoria.course.tab";

export function isCourseTabId(value: unknown): value is CourseTabId {
  return COURSE_TABS.some((tab) => tab.id === value);
}

/** Onglet à ouvrir : celui mémorisé s'il est valide et disponible, sinon « Leçons ». */
export function chooseInitialTab(stored: string | null | undefined, hasQuiz: boolean): CourseTabId {
  if (!isCourseTabId(stored)) return DEFAULT_COURSE_TAB;
  if (stored === "quiz" && !hasQuiz) return DEFAULT_COURSE_TAB;
  return stored;
}

/** Onglet voisin pour la navigation au clavier (flèches, Début, Fin), en boucle ; `null` pour une autre touche. */
export function tabForKey(current: CourseTabId, key: string): CourseTabId | null {
  const index = COURSE_TABS.findIndex((tab) => tab.id === current);
  const last = COURSE_TABS.length - 1;
  switch (key) {
    case "ArrowRight":
      return COURSE_TABS[index === last ? 0 : index + 1].id;
    case "ArrowLeft":
      return COURSE_TABS[index === 0 ? last : index - 1].id;
    case "Home":
      return COURSE_TABS[0].id;
    case "End":
      return COURSE_TABS[last].id;
    default:
      return null;
  }
}

const tabStore = createStoredValue<string | null>(COURSE_TAB_STORAGE_KEY, (raw) => raw, (tab) => tab ?? "");

export const subscribeTab = tabStore.subscribe;

/** Onglet mémorisé (mémoire, sinon localStorage) ; null si aucun. */
export const readStoredTab = tabStore.read;

export function storeTab(tab: CourseTabId): void {
  tabStore.write(tab);
}
