/**
 * Types TypeScript pour la feature "Course Generation".
 *
 * ⚠️ INCOHÉRENCE BACKEND DOCUMENTÉE :
 * Le backend retourne `sections` / `common_pitfalls` / `quiz` / `introduction` comme
 * nullable **indépendamment du champ `format`**. C'est une incohérence dans
 * `_map_schema_to_response` (course_generator.py) : le `format` décrit l'intention
 * pédagogique mais ne garantit PAS la présence de ces champs.
 *
 * Règle côté frontend : TOUJOURS traiter ces champs comme potentiellement null,
 * et NE JAMAIS se baser uniquement sur `format` pour décider d'afficher un bloc.
 *
 * Source : analyse du code backend sur `master`, `_map_schema_to_response`.
 */

// ─── Enums ──────────────────────────────────────────────────

export type CourseFormat = "focused_answer" | "full_course" | "quiz_only";

export type SourceType = "file" | "web";

export type FileIngestStatus = "ok" | "failed" | "error";

// ─── Course Generation Request ──────────────────────────────

export interface CourseGenerationRequest {
  question: string;
  filename?: string | string[];
  format?: CourseFormat;
  language?: string;
}

// ─── Course Generation Response ─────────────────────────────

export interface CourseSource {
  type: SourceType;
  title: string;
  url?: string | null;
}

export interface CourseMeta {
  subject: string;
  title: string;
  format: CourseFormat;
  language: string;
}

export interface Step {
  title: string;
  content: string;
}

export interface WorkedExample {
  statement: string | null;
  steps: Step[];
  result: string | null;
}

export interface CourseAnswer {
  what: string;
  why: string;
  how: string;
  worked_example: WorkedExample | null;
}

export interface CourseSection {
  title: string;
  answer: CourseAnswer;
}

export interface CoursePitfall {
  title: string;
  description: string;
  tip?: string | null;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  time_limit_seconds?: number | null;
}

// ─── Response principale ────────────────────────────────────

/**
 * Réponse de l'endpoint POST /courses/generate.
 *
 * ⚠️ `sections`, `common_pitfalls`, `quiz`, `introduction` sont nullable
 * indépendamment de `format` (cf. en-tête de fichier).
 */
export interface CourseGenerationResponse {
  meta: CourseMeta;
  introduction: string | null;
  sources: CourseSource[];
  sections: CourseSection[] | null;
  common_pitfalls: CoursePitfall[] | null;
  quiz: QuizQuestion[] | null;
  summary: string | null;
  next_steps: string[] | null;
}

// ─── Error types ────────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  body?: unknown;
}

export const ERROR_MESSAGES: Record<number, string> = {
  413: "Votre question est trop longue. Raccourcissez-la et réessayez.",
  429: "Quota d'appels Gemini atteint. Réessayez dans quelques instants.",
  502: "Réponse invalide du moteur IA. Réessayez.",
  503: "Le moteur IA est temporairement indisponible. Réessayez dans quelques instants.",
};
