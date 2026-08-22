/** Longueur max de la question (alignée sur COURSE_QUESTION_MAX_LENGTH du backend) */
export const COURSE_QUESTION_MAX_LENGTH = 2000;

/** Taille max d'un fichier PDF côté client (10 Mo) */
export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

/** Label du format détecté */
export const MODE_LABELS = {
  "focused_answer": "Réponse ciblée",
  "full_course": "Cours complet",
  "quiz_only": "Quiz",
} as const;
