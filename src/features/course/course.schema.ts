import { z } from "zod";
import { COURSE_QUESTION_MAX_LENGTH } from "@/shared/utils/constants";

// ─── Schemas de réponse (validation défensive) ──────────────

const stepSchema = z.object({
  title: z.string(),
  content: z.string(),
});

const workedExampleSchema = z.object({
  statement: z.string().nullable(),
  steps: z.array(stepSchema),
  result: z.string().nullable(),
});

const courseAnswerSchema = z.object({
  what: z.string(),
  why: z.string(),
  how: z.string(),
  worked_example: workedExampleSchema.nullable(),
});

const courseSectionSchema = z.object({
  title: z.string(),
  answer: courseAnswerSchema,
});

const coursePitfallSchema = z.object({
  title: z.string(),
  description: z.string(),
  tip: z.string().nullable().optional(),
});

const quizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correct_option_index: z.number(),
  explanation: z.string(),
  time_limit_seconds: z.number().nullable().optional(),
});

const courseSourceSchema = z.object({
  type: z.enum(["file", "web"]),
  title: z.string(),
  url: z.string().nullable().optional(),
});

const courseMetaSchema = z.object({
  subject: z.string(),
  title: z.string(),
  format: z.enum(["focused_answer", "full_course", "quiz_only"]),
  language: z.string(),
});

export const courseResponseSchema = z.object({
  meta: courseMetaSchema,
  introduction: z.string().nullable(),
  sources: z.array(courseSourceSchema),
  sections: z.array(courseSectionSchema).nullable(),
  common_pitfalls: z.array(coursePitfallSchema).nullable(),
  quiz: z.array(quizQuestionSchema).nullable(),
  summary: z.string().nullable(),
  next_steps: z.array(z.string()).nullable(),
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
