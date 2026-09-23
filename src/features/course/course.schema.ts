import { z } from "zod";
import {
  COURSE_PLAN_MAX_SECTIONS,
  COURSE_QUESTION_MAX_LENGTH,
  PLAN_OBJECTIVE_MAX_LENGTH,
  PLAN_SUBTOPIC_MAX_LENGTH,
  PLAN_SUBTOPICS_MAX_ITEMS,
  PLAN_TITLE_MAX_LENGTH,
  RECALL_ANSWER_MAX_LENGTH,
  SECTION_NOTE_MAX_LENGTH,
} from "@/shared/utils/constants";

// ─── Schemas de réponse (validation défensive) ──────────────

const stepSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  content: z.string(),
});

const workedExampleSchema = z.object({
  statement: z.string().optional().default(""),
  steps: z.array(stepSchema).optional().default([]),
  result: z.string().optional().default(""),
});

const courseTableSchema = z.object({
  caption: z.string().optional().default(""),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

const courseVideoSchema = z.object({
  video_id: z.string(),
  url: z.string(),
  embed_url: z.string(),
  thumbnail_url: z.string(),
  title: z.string().optional().default(""),
  channel: z.string().optional().default(""),
  duration_seconds: z.number().nullish(),
  published_at: z.string().nullish(),
  // V2 (classement pédagogique) : absents tant que ranking est désactivé côté backend.
  category: z.string().nullish(),
  level: z.string().nullish(),
  relevance_reason: z.string().nullish(),
});

/** Bloc visuel de la réponse directe (sérialisation d'un ContentBlock ; champs inconnus ignorés). */
const answerBlockSchema = z.object({
  type: z.string().optional(),
  text: z.string().nullish(),
  list_items: z.array(z.string()).nullish(),
  table: courseTableSchema.nullish(),
});

const courseAnswerSchema = z.object({
  summary: z.string().optional().default(""),
  blocks: z.array(answerBlockSchema).optional().default([]),
  quoi: z.string().optional().default(""),
  pourquoi: z.string().optional().default(""),
  comment: z.string().optional().default(""),
  worked_example: workedExampleSchema.optional(),
  key_points: z.array(z.string()).optional().default([]),
  tables: z.array(courseTableSchema).optional().default([]),
});

const courseContentBlockSchema = z.object({
  type: z.string(),
  text: z.string().nullish(),
  callout_variant: z.enum(["note", "warning", "tip"]).nullish().catch(null),
  list_items: z.array(z.string()).nullish(),
  list_ordered: z.boolean().nullish(),
  table: courseTableSchema.nullish(),
  formula: z.object({ latex: z.string(), description: z.string().nullish() }).nullish(),
  code_language: z.string().nullish(),
  code: z.string().nullish(),
  worked_example: z
    .object({
      statement: z.string().optional().default(""),
      steps: z.array(z.string()).optional().default([]),
      result: z.string().optional().default(""),
    })
    .nullish(),
  image_caption: z.string().nullish(),
  pitfall: z
    .object({
      description: z.string(),
      why_it_happens: z.string().optional().default(""),
      how_to_avoid: z.string().optional().default(""),
    })
    .nullish(),
  diagram: z
    .object({
      kind: z.enum(["flowchart", "sequence", "hierarchy", "cycle"]),
      caption: z.string().optional().default(""),
      mermaid: z.string(),
    })
    .nullish()
    .catch(null), // un visuel invalide est ignoré, il ne doit pas invalider tout le cours
  chart: z
    .object({
      kind: z.enum(["bar", "line", "pie"]),
      caption: z.string().optional().default(""),
      labels: z.array(z.string()),
      series: z.array(z.object({ name: z.string(), values: z.array(z.number()) })),
    })
    .nullish()
    .catch(null),
});

const courseSubsectionSchema = z.object({
  title: z.string().optional().default(""),
  blocks: z.array(courseContentBlockSchema).optional().default([]),
});

const fadedExampleSchema = z.object({
  statement: z.string().optional().default(""),
  given_steps: z.array(z.string()).optional().default([]),
  hidden_steps: z.array(z.string()).optional().default([]),
  result: z.string().optional().default(""),
});

const recallPromptSchema = z.object({
  prompt: z.string(),
  expected_key_points: z.array(z.string()).optional().default([]),
});

const courseSectionSchema = z.object({
  id: z.string().optional(),
  /** Cycle pédagogique : tous optionnels (sessions historiques sans cycle) */
  challenge: z.string().optional().default(""),
  faded_example: fadedExampleSchema.nullish(),
  check_questions: z.array(z.lazy(() => quizQuestionSchema)).optional().default([]),
  recall_prompt: recallPromptSchema.nullish(),
  subsections: z.array(courseSubsectionSchema).optional().default([]),
  title: z.string(),
  quoi: z.string().optional().default(""),
  pourquoi: z.string().optional().default(""),
  comment: z.string().optional().default(""),
  worked_example: workedExampleSchema.optional(),
  key_points: z.array(z.string()).optional().default([]),
  tables: z.array(courseTableSchema).optional().default([]),
  incomplete: z.boolean().optional().default(false),
  note: z.string().optional().default(""),
});

const coursePitfallSchema = z.object({
  description: z.string().optional().default(""),
  why_it_happens: z.string().optional().default(""),
  how_to_avoid: z.string().optional().default(""),
  title: z.string().optional(),
  tip: z.string().optional(),
});

const quizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2),
  /** Indices 0-based des bonnes réponses (1 = unique, >1 = QCM multiple) */
  correct_option_indices: z.array(z.number()).default([]),
  /** Niveau de difficulté */
  difficulty: z.enum(["facile", "normale", "difficile"]).default("normale"),
  /** Points alloués (calculé côté serveur, total = 20/20) */
  points: z.number().min(0).default(1),
  explanation: z.string().optional().default(""),
  /** Retour par option (bonne réponse ou distracteur), dans l'ordre des options */
  explanation_per_choice: z.array(z.string()).optional().default([]),
  /** Sections (position 1-based) mobilisées par la question (quiz final) */
  section_refs: z.array(z.number()).optional().default([]),
  /** 45s par défaut, 80s si la question implique un calcul */
  time_limit_seconds: z.number().default(45),
});

const courseSourceSchema = z.object({
  type: z.enum(["file", "web"]),
  label: z.string().optional().default(""),
  reference: z.string().optional().default(""),
  title: z.string().optional(),
  url: z.string().nullable().optional(),
});

const courseMetaSchema = z.object({
  subject: z.string().optional().default(""),
  title: z.string().optional().default(""),
  format: z.string().optional().default("focused_answer"),
  language: z.string().optional().default("fr"),
  generated_at: z.string().optional(),
});

export const courseResponseSchema = z.object({
  mode: z.enum(["file_only", "file_question", "question_only"]),
  format: z.enum(["full_course", "focused_answer"]),
  meta: courseMetaSchema,
  introduction: z.record(z.string(), z.string()).nullable().optional(),
  sources: z.array(courseSourceSchema).optional().default([]),
  answer: courseAnswerSchema.optional(),
  sections: z.array(courseSectionSchema).nullable().optional(),
  common_pitfalls: z.array(coursePitfallSchema).nullable().optional(),
  quiz: z.array(quizQuestionSchema).nullable().optional(),
  summary: z.string().nullable().optional(),
  next_steps: z.array(z.string()).nullable().optional(),
  videos: z.array(courseVideoSchema).nullish(),
  // Absents des cours déjà en sessionStorage / historique : toujours optionnels
  session_id: z.string().nullish(),
  podcast_job_id: z.string().nullish(),
});

export type ParsedCourseResponse = z.infer<typeof courseResponseSchema>;

// ─── Schema de validation formulaire question ───────────────

export const questionInputSchema = z.object({
  question: z
    .string()
    .min(1, "La question ne peut pas être vide.")
    .max(
      COURSE_QUESTION_MAX_LENGTH,
      `La question ne peut pas dépasser ${COURSE_QUESTION_MAX_LENGTH} caractères.`,
    ),
  filename: z.union([z.string(), z.array(z.string())]).nullish(),
  format: z.enum(["focused_answer", "full_course", "quiz_only"]).optional(),
  language: z.string().optional(),
});

export type QuestionInputValues = z.infer<typeof questionInputSchema>;

// ─── Plan de cours ──────────────────────────────────────────

export const plannedSectionSchema = z.object({
  type: z.enum(["introduction", "development", "common_pitfalls", "summary", "next_steps"]),
  title: z.string().trim().min(1, "Chaque section doit avoir un titre.").max(PLAN_TITLE_MAX_LENGTH),
  objective: z.string().trim().max(PLAN_OBJECTIVE_MAX_LENGTH).default(""),
  subtopics: z
    .array(z.string().trim().min(1).max(PLAN_SUBTOPIC_MAX_LENGTH))
    .max(PLAN_SUBTOPICS_MAX_ITEMS)
    .default([]),
  order: z.number().int().min(1),
  /** « known » : section déjà maîtrisée (pré-test réussi) → version condensée */
  mastery: z.literal("known").nullish(),
});

/** Question du pré-test diagnostique (une par section de développement). */
export const pretestItemSchema = z.object({
  section_title: z.string(),
  question: z.lazy(() => quizQuestionSchema),
});

/** Réponse de POST /courses/plan */
export const coursePlanSchema = z.object({
  plan_id: z.string().min(1),
  expires_at: z.string(),
  mode: z.enum(["file_question", "question_only"]),
  meta: z.object({
    title: z.string().default(""),
    subject: z.string().default(""),
    language: z.string().default("fr"),
  }),
  sections: z.array(plannedSectionSchema).min(1),
  pretest: z.array(pretestItemSchema).optional().default([]),
  coverage_notes: z.string().default(""),
});

/** Élément de GET /courses/plans */
export const pendingPlanItemSchema = z.object({
  plan_id: z.string().min(1),
  question: z.string().default(""),
  title: z.string().default(""),
  subject: z.string().default(""),
  sections_count: z.number().int().min(0),
  created_at: z.string(),
  expires_at: z.string(),
});

/** Réponse paginée de GET /courses/plans */
export const pendingPlansResponseSchema = z.object({
  status: z.string().optional().default("ok"),
  data: z.array(pendingPlanItemSchema),
  meta: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

/** Réponse de GET /courses/plans/{plan_id} */
export const pendingPlanDetailSchema = coursePlanSchema.extend({
  question: z.string().default(""),
  filenames: z.array(z.string()).default([]),
});

/** Réponse de POST /courses/plan/more-sections */
export const moreSectionsResponseSchema = z.object({
  sections: z.array(plannedSectionSchema).min(1),
  /** « Pour aller plus loin » actualisée (remplace l'ancienne) ; absente si le plan n'en avait pas. */
  next_steps: plannedSectionSchema.nullish(),
});

/** Requête de POST /courses/generate/from-plan (mêmes règles que le backend) */
export const courseFromPlanRequestSchema = z.object({
  plan_id: z.string().min(1),
  sections: z
    .array(plannedSectionSchema)
    .min(1, "Le plan doit contenir au moins une section.")
    .max(COURSE_PLAN_MAX_SECTIONS, `Un plan ne peut pas dépasser ${COURSE_PLAN_MAX_SECTIONS} sections.`)
    .refine((sections) => sections.some((s) => s.type === "development"), {
      message: "Le plan doit contenir au moins une section de développement.",
    }),
});

// ─── Reformulation (« explique avec tes mots ») ─────────────

/** Requête de POST /courses/{session_id}/sections/{section_id}/recall (mêmes bornes que le backend) */
export const recallRequestSchema = z.object({
  answer: z
    .string()
    .trim()
    .min(1, "Écrivez votre explication avant de la soumettre.")
    .max(RECALL_ANSWER_MAX_LENGTH, `Votre explication ne peut pas dépasser ${RECALL_ANSWER_MAX_LENGTH} caractères.`),
});

/** Réponse de POST .../recall */
export const recallResponseSchema = z.object({
  verdict: z.enum(["correct", "partiel", "incorrect"]),
  feedback: z.string(),
  missing_points: z.array(z.string()).optional().default([]),
});

// ─── Régénération d'une section incomplète ───────────────────

/** Réponse de POST .../regenerate : la section mise à jour (mêmes règles que dans le cours). */
export const regenerateSectionResponseSchema = courseSectionSchema;

// ─── Note libre sur une section ───────────────────────────────

/** Requête de PUT .../note (mêmes bornes que le backend ; vide = note effacée) */
export const sectionNoteRequestSchema = z.object({
  note: z
    .string()
    .trim()
    .max(SECTION_NOTE_MAX_LENGTH, `La note ne peut pas dépasser ${SECTION_NOTE_MAX_LENGTH} caractères.`),
});

/** Réponse de PUT .../note */
export const sectionNoteResponseSchema = z.object({
  note: z.string(),
  updated_at: z.string(),
});
