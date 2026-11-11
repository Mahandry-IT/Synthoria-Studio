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

// Magasin minimal pour useSyncExternalStore : l'onglet choisi vit en mémoire (repli si le stockage
// est indisponible) et est recopié dans localStorage.
let memoryTab: string | null = null;
const listeners = new Set<() => void>();

export function subscribeTab(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Onglet mémorisé (mémoire, sinon localStorage) ; null si aucun. */
export function readStoredTab(): string | null {
  if (memoryTab) return memoryTab;
  try {
    return window.localStorage.getItem(COURSE_TAB_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeTab(tab: CourseTabId): void {
  memoryTab = tab;
  try {
    window.localStorage.setItem(COURSE_TAB_STORAGE_KEY, tab);
  } catch {
    // Stockage indisponible (navigation privée, quota) : seule la mémoire de la page est conservée
  }
  listeners.forEach((listener) => listener());
}
