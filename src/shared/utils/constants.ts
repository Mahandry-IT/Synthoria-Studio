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

/** Plafond de sections d'un plan (aligné sur COURSE_PLAN_MAX_SECTIONS du backend — protection anti-abus, pas une limite pédagogique) */
export const COURSE_PLAN_MAX_SECTIONS = 80;
/** Longueur max des précisions données à l'IA pour compléter une section (aligné sur le backend) */
export const PLAN_INSTRUCTIONS_MAX_LENGTH = 1000;

/** Limites de champs d'une section de plan (alignées sur le backend) */
export const PLAN_TITLE_MAX_LENGTH = 200;
export const PLAN_OBJECTIVE_MAX_LENGTH = 1000;
export const PLAN_SUBTOPIC_MAX_LENGTH = 300;
export const PLAN_SUBTOPICS_MAX_ITEMS = 20;

/** Longueur maximale d'une reformulation « explique avec tes mots » (alignée sur le backend). */
export const RECALL_ANSWER_MAX_LENGTH = 1000;

/** Longueur maximale d'une note libre sur une section (alignée sur le backend). */
export const SECTION_NOTE_MAX_LENGTH = 2000;

/** Longueur maximale d'une note libre sur une vidéo (alignée sur le backend). */
export const VIDEO_NOTE_MAX_LENGTH = 2000;
