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

/** Tableau structuré renvoyé par le backend (rendu en vrai tableau, pas en texte aplati) */
export interface CourseTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

/** Vidéo YouTube vérifiée côté backend */
export interface CourseVideo {
  video_id: string;
  url: string;
  embed_url: string;
  thumbnail_url: string;
  title: string;
  channel?: string;
}

/** Bloc de la réponse directe (ContentBlock sérialisé). */
export interface AnswerContentBlock {
  type?: string;
  text?: string | null;
  list_items?: string[] | null;
  table?: CourseTable | null;
}

/**
 * Réponse directe (`summary` + `key_points` + `blocks`). Les champs
 * `quoi/pourquoi/comment/worked_example` sont l'ancien format (historique).
 */
export interface CourseAnswer {
  summary?: string;
  blocks?: AnswerContentBlock[];
  quoi?: string;
  pourquoi?: string;
  comment?: string;
  worked_example?: WorkedExample;
  key_points?: string[];
  tables?: CourseTable[];
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

export interface CourseDiagram {
  kind: "flowchart" | "sequence" | "hierarchy" | "cycle";
  caption?: string;
  mermaid: string;
}

export interface CourseChart {
  kind: "bar" | "line" | "pie";
  caption?: string;
  labels: string[];
  series: { name: string; values: number[] }[];
}

/**
 * Bloc de contenu typé (contrat par blocs). `type` reste une chaîne : un type inconnu (backend plus
 * récent que le front) est ignoré par `BlockRenderer` au lieu de casser la page.
 */
export interface CourseContentBlock {
  type: string;
  text?: string | null;
  callout_variant?: "note" | "warning" | "tip" | null;
  list_items?: string[] | null;
  list_ordered?: boolean | null;
  table?: CourseTable | null;
  formula?: { latex: string; description?: string | null } | null;
  code_language?: string | null;
  code?: string | null;
  worked_example?: { statement?: string; steps?: string[]; result?: string } | null;
  image_caption?: string | null;
  pitfall?: { description: string; why_it_happens?: string; how_to_avoid?: string } | null;
  diagram?: CourseDiagram | null;
  chart?: CourseChart | null;
}

export interface CourseSubsection {
  title: string;
  blocks: CourseContentBlock[];
}

export interface FadedExample {
  statement?: string;
  given_steps?: string[];
  hidden_steps?: string[];
  result?: string;
}

export interface RecallPrompt {
  prompt: string;
  expected_key_points?: string[];
}

export interface CourseSection {
  id?: string;
  /** Cycle pédagogique (défi → … → À toi → Vérifie → reformulation) ; absent des sessions historiques. */
  challenge?: string;
  faded_example?: FadedExample | null;
  check_questions?: QuizQuestion[];
  recall_prompt?: RecallPrompt | null;
  /** Contenu par blocs (référence). Absent des sessions historiques : rendu legacy quoi/pourquoi/comment. */
  subsections?: CourseSubsection[];
  title: string;
  quoi?: string;
  pourquoi?: string;
  comment?: string;
  worked_example?: WorkedExample;
  key_points?: string[];
  tables?: CourseTable[];
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
  /** Retour par option (bonne réponse ou distracteur), dans l'ordre des options */
  explanation_per_choice?: string[];
  /** Sections (position 1-based) mobilisées par la question (quiz final) */
  section_refs?: number[];
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
  /** Vidéos YouTube expliquant le cours (absent sur les anciens cours) */
  videos?: CourseVideo[] | null;
  /** Id de la session persistée côté backend (absent si la persistance a échoué ou sur un ancien cours) */
  session_id?: string | null;
  /** Job podcast lancé automatiquement par le backend après la génération, le cas échéant */
  podcast_job_id?: string | null;
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
  /** « known » : déjà maîtrisée (pré-test réussi) → version condensée */
  mastery?: "known" | null;
}

/** Question du pré-test diagnostique (une par section de développement). */
export interface PretestItem {
  section_title: string;
  question: QuizQuestion;
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
  pretest?: PretestItem[];
  coverage_notes: string;
}

/** Réponse de l'évaluation d'une reformulation. */
export interface RecallResponse {
  verdict: "correct" | "partiel" | "incorrect";
  feedback: string;
  missing_points: string[];
}

/** Mêmes paramètres que la génération directe */
export type CoursePlanRequest = CourseGenerationRequest;

/** Requête de POST /courses/generate/from-plan */
export interface CourseFromPlanRequest {
  plan_id: string;
  sections: PlannedSection[];
}

/** Élément de GET /courses/plans : plan non expiré, pas encore transformé en cours */
export interface PendingPlanItem {
  plan_id: string;
  question: string;
  title: string;
  subject: string;
  sections_count: number;
  created_at: string;
  expires_at: string;
}

/** Réponse de GET /courses/plans/{plan_id} : le plan et la requête d'origine (reprise) */
export interface PendingPlanDetail extends CoursePlan {
  question: string;
  filenames: string[];
}

/** Requête de POST /courses/plan/refine-section : complète une section jugée incomplète */
export interface RefineSectionRequest {
  plan_id: string;
  /** Section actuelle (l'ancienne version, telle qu'éditée) */
  section: PlannedSection;
  /** Plan complet courant, pour éviter les doublons */
  sections: PlannedSection[];
  /** Ce que l'utilisateur veut voir ajouter ; absent = l'IA détermine ce qui manque */
  instructions?: string;
}

/** Requête de POST /courses/plan/more-sections : sections issues de « Pour aller plus loin » */
export interface MoreSectionsRequest {
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
