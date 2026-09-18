/**
 * Types TypeScript pour la feature "Course Generation".
 * Alignés sur la réponse réelle de l'API backend.
 */

// ─── Enums ──────────────────────────────────────────────────

export type CourseFormat = string;

export type SourceType = "file" | "web";

export type FileIngestStatus = "ok" | "failed" | "error";

export type QuizDifficulty = "facile" | "normale" | "difficile";

// ─── Sub-types ──────────────────────────────────────────────

export interface Step {
  id?: string;
  title?: string;
  content: string;
}

export interface WorkedExample {
  statement?: string;
  steps: Step[];
  result?: string;
}

export interface CourseAnswer {
  quoi?: string;
  pourquoi?: string;
  comment?: string;
  worked_example?: WorkedExample;
  key_points?: string[];
}

export interface CourseSource {
  type: SourceType;
  label?: string;
  reference?: string;
  title?: string;
  url?: string | null;
}

export interface CourseMeta {
  subject?: string;
  title?: string;
  format?: string;
  language?: string;
  generated_at?: string;
}

export interface CourseSection {
  id?: string;
  title: string;
  quoi?: string;
  pourquoi?: string;
  comment?: string;
  worked_example?: WorkedExample;
  key_points?: string[];
  answer?: CourseAnswer;
}

export interface CoursePitfall {
  description: string;
  why_it_happens?: string;
  how_to_avoid?: string;
  title?: string;
  tip?: string | null;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Indices 0-based des bonnes réponses (1 = unique, >1 = QCM multiple) */
  correct_option_indices: number[];
  /** Niveau de difficulté */
  difficulty: QuizDifficulty;
  /** Points alloués (calculé côté serveur, total = 20/20) */
  points: number;
  explanation?: string;
  /** 45s par défaut, 80s si la question implique un calcul */
  time_limit_seconds?: number | null;
}

// ─── Quiz flow types ───────────────────────────────────────

export type QuizPhase = "intro" | "in_progress" | "results";

export interface QuizUserAnswer {
  questionIndex: number;
  selectedOptionIndices: number[];
}

// ─── Request ────────────────────────────────────────────────

export interface CourseGenerationRequest {
  question?: string | null;
  /** Mode de génération : file_question ou question_only */
  mode?: "file_question" | "question_only";
  /** Nombre de chunks à récupérer pour le contexte (1-20, défaut 20) */
  top_k?: number;
  /** Filtre optionnel sur un ou plusieurs documents déjà ingérés */
  filename?: string | string[];
  /** Si true, récupère l'intégralité des chunks du/des fichier(s) */
  full_document?: boolean;
}

// ─── Response ───────────────────────────────────────────────

export interface CourseGenerationResponse {
  mode: "file_only" | "file_question" | "question_only";
  format: "full_course" | "focused_answer";
  meta: CourseMeta;
  /** Uniquement pour format == "full_course" */
  introduction?: Record<string, string> | null;
  sources: CourseSource[];
  /** Uniquement pour format == "focused_answer" */
  answer?: CourseAnswer;
  /** Uniquement pour format == "full_course" */
  sections?: CourseSection[] | null;
  common_pitfalls?: CoursePitfall[] | null;
  quiz?: QuizQuestion[] | null;
  summary?: string | null;
  next_steps?: string[] | null;
}

// ─── Plan de cours (génération en deux temps) ──────────────

export type PlannedSectionType =
  | "introduction"
  | "development"
  | "common_pitfalls"
  | "summary"
  | "next_steps";

export interface PlannedSection {
  type: PlannedSectionType;
  title: string;
  objective: string;
  subtopics: string[];
  /** Position 1-based dans le cours */
  order: number;
}

export interface CoursePlanMeta {
  title: string;
  subject: string;
  language: string;
}

/** Réponse de POST /courses/plan */
export interface CoursePlan {
  plan_id: string;
  expires_at: string;
  mode: "file_question" | "question_only";
  meta: CoursePlanMeta;
  sections: PlannedSection[];
  coverage_notes: string;
}

/** Mêmes paramètres que la génération directe */
export type CoursePlanRequest = CourseGenerationRequest;

/** Requête de POST /courses/generate/from-plan */
export interface CourseFromPlanRequest {
  plan_id: string;
  sections: PlannedSection[];
}

// ─── Error types ────────────────────────────────────────────

export const ERROR_MESSAGES: Record<number, string> = {
  404: "Plan introuvable. Régénérez le plan.",
  410: "Ce plan a expiré. Régénérez-le.",
  413: "Votre question est trop longue. Raccourcissez-la et réessayez.",
  422: "Le plan est invalide : au moins une section de développement est requise (80 sections maximum).",
  429: "Quota d'appels Gemini atteint. Réessayez dans quelques instants.",
  502: "Réponse invalide du moteur IA. Réessayez.",
  503: "Le moteur IA est temporairement indisponible. Réessayez dans quelques instants.",
};
