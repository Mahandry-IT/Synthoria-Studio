export const COURSE_SECTIONS = [
  { id: "question", label: "Question", name: "Question", icon: "question" },
  { id: "podcast", label: "Podcast", name: "Podcast", icon: "podcast" },
  { id: "course", label: "Cours", name: "Cours", icon: "course" },
  { id: "pitfalls", label: "Pièges", name: "Pièges", icon: "pitfalls" },
  { id: "summary", label: "Résumé", name: "Résumé", icon: "summary" },
  { id: "next-steps", label: "Suite", name: "Prochaines étapes", icon: "nextSteps" },
] as const;

export type CourseSectionId = (typeof COURSE_SECTIONS)[number]["id"];
export type CourseSectionIconName = (typeof COURSE_SECTIONS)[number]["icon"];
export type CourseSectionDef = (typeof COURSE_SECTIONS)[number];

export const DEFAULT_COURSE_SECTION: CourseSectionId = "course";

export function isCourseSectionId(value: unknown): value is CourseSectionId {
  return COURSE_SECTIONS.some((section) => section.id === value);
}

/**
 * Le bloc « Cours » (sections, quiz, exercices) n'a de sens que s'il y a du contenu de cours ; sans
 * section ni quiz, un cours en réponse ciblée s'ouvre sur la réponse directe (bloc « Question »).
 */
export function hasCourseBlock(c: { sectionCount: number; hasQuiz: boolean; hasAnswer: boolean }): boolean {
  return c.sectionCount > 0 || c.hasQuiz || !c.hasAnswer;
}

export interface CourseSectionAvailability {
  hasQuestion: boolean;
  hasAnswer: boolean;
  hasPodcast: boolean;
  hasCourse: boolean;
  hasPitfalls: boolean;
  hasSummary: boolean;
  hasNextSteps: boolean;
}

/** Blocs ayant des données, dans l'ordre de la barre : pas d'icône morte. */
export function availableSections(a: CourseSectionAvailability): CourseSectionDef[] {
  const present: Record<CourseSectionId, boolean> = {
    question: a.hasQuestion || a.hasAnswer,
    podcast: a.hasPodcast,
    course: a.hasCourse,
    pitfalls: a.hasPitfalls,
    summary: a.hasSummary,
    "next-steps": a.hasNextSteps,
  };
  return COURSE_SECTIONS.filter((section) => present[section.id]);
}

/** Bloc à ouvrir : celui mémorisé s'il est valide et disponible, sinon « Cours », sinon le premier disponible. */
export function chooseInitialSection(
  stored: string | null | undefined,
  available: readonly CourseSectionDef[],
): CourseSectionId {
  const has = (id: unknown) => available.some((section) => section.id === id);
  if (isCourseSectionId(stored) && has(stored)) return stored;
  if (has(DEFAULT_COURSE_SECTION)) return DEFAULT_COURSE_SECTION;
  return available[0]?.id ?? DEFAULT_COURSE_SECTION;
}

/**
 * Bloc voisin pour le clavier, en boucle : bas/droite = suivant, haut/gauche = précédent (la barre
 * est verticale sur desktop, horizontale sur mobile), Début, Fin. `null` pour une autre touche.
 */
export function sectionForKey(
  current: CourseSectionId,
  key: string,
  available: readonly CourseSectionDef[],
): CourseSectionId | null {
  if (available.length === 0) return null;
  const index = Math.max(0, available.findIndex((section) => section.id === current));
  const last = available.length - 1;
  switch (key) {
    case "ArrowDown":
    case "ArrowRight":
      return available[index === last ? 0 : index + 1].id;
    case "ArrowUp":
    case "ArrowLeft":
      return available[index === 0 ? last : index - 1].id;
    case "Home":
      return available[0].id;
    case "End":
      return available[last].id;
    default:
      return null;
  }
}
