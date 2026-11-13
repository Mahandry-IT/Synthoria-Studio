import type { z } from "zod";
import type {
  exerciseDetailSchema,
  exerciseEnqueueResponseSchema,
  exerciseFeedbackSchema,
  exerciseListSchema,
  exerciseStatusSchema,
  exerciseSummarySchema,
} from "./exercise.schema";

export type ExerciseStatus = z.infer<typeof exerciseStatusSchema>;
export type ExerciseSummary = z.infer<typeof exerciseSummarySchema>;
export type ExerciseList = z.infer<typeof exerciseListSchema>;
export type ExerciseEnqueueResponse = z.infer<typeof exerciseEnqueueResponseSchema>;
export type ExerciseDetail = z.infer<typeof exerciseDetailSchema>;
export type ExerciseFeedback = z.infer<typeof exerciseFeedbackSchema>;
