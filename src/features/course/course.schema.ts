import { z } from "zod";
import { COURSE_QUESTION_MAX_LENGTH } from "@/shared/utils/constants";

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

const courseAnswerSchema = z.object({
  quoi: z.string().optional().default(""),
  pourquoi: z.string().optional().default(""),
  comment: z.string().optional().default(""),
  worked_example: workedExampleSchema.optional(),
  key_points: z.array(z.string()).optional().default([]),
});

const courseSectionSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  quoi: z.string().optional().default(""),
  pourquoi: z.string().optional().default(""),
  comment: z.string().optional().default(""),
  worked_example: workedExampleSchema.optional(),
  key_points: z.array(z.string()).optional().default([]),
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
  options: z.array(z.string()),
  correct_option_index: z.number(),
  explanation: z.string().optional().default(""),
  time_limit_seconds: z.number().nullable().optional(),
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
  mode: z.string().optional(),
  format: z.string().optional(),
  meta: courseMetaSchema,
  introduction: z.string().nullable().optional(),
  sources: z.array(courseSourceSchema).optional().default([]),
  answer: courseAnswerSchema.optional(),
  sections: z.array(courseSectionSchema).nullable().optional(),
  common_pitfalls: z.array(coursePitfallSchema).nullable().optional(),
  quiz: z.array(quizQuestionSchema).nullable().optional(),
  summary: z.string().nullable().optional(),
  next_steps: z.array(z.string()).nullable().optional(),
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
