/**
 * Types TypeScript pour la feature "Course Generation".
 * Alignés sur la réponse réelle de l'API backend.
 */

// ─── Enums ──────────────────────────────────────────────────

export type CourseFormat = string;

export type SourceType = "file" | "web";

export type FileIngestStatus = "ok" | "failed" | "error";

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
  correct_option_index: number;
  explanation?: string;
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
  question: string;
  filename?: string | string[];
  format?: string;
  language?: string;
}

// ─── Response ───────────────────────────────────────────────

export interface CourseGenerationResponse {
  mode?: string;
  format?: string;
  meta: CourseMeta;
  introduction?: string | null;
  sources: CourseSource[];
  answer?: CourseAnswer;
  sections?: CourseSection[] | null;
  common_pitfalls?: CoursePitfall[] | null;
  quiz?: QuizQuestion[] | null;
  summary?: string | null;
  next_steps?: string[] | null;
}

// ─── Error types ────────────────────────────────────────────

export const ERROR_MESSAGES: Record<number, string> = {
  413: "Votre question est trop longue. Raccourcissez-la et réessayez.",
  429: "Quota d'appels Gemini atteint. Réessayez dans quelques instants.",
  502: "Réponse invalide du moteur IA. Réessayez.",
  503: "Le moteur IA est temporairement indisponible. Réessayez dans quelques instants.",
};
