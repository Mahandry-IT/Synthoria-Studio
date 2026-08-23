import type { CourseGenerationResponse } from "@/features/course/course.types";

export interface CourseHistoryItem {
  id: string;
  created_at: string;
  question: string;
  filenames: string[];
  mode: "file_question" | "question_only";
}

export interface CourseHistoryDetail extends CourseHistoryItem {
  gemini_response: CourseGenerationResponse;
}
