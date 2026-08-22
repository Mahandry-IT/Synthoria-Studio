"use client";

import { useMutation } from "@tanstack/react-query";
import { generateCourse } from "../course.api";
import type { CourseGenerationRequest, CourseGenerationResponse } from "../course.types";
import { HttpError } from "@/shared/api/httpClient";

interface UseGenerateCourseReturn {
  mutate: (payload: CourseGenerationRequest) => void;
  data: CourseGenerationResponse | null;
  error: HttpError | null;
  isPending: boolean;
  reset: () => void;
}

/**
 * Mutation React Query pour la génération de cours.
 * Expose data (CourseGenerationResponse | null), error (HttpError | null), isPending.
 *
 * Le mode est auto-détecté : pas de filename → Mode 3, filename → Mode 2.
 */
export function useGenerateCourse(): UseGenerateCourseReturn {
  const mutation = useMutation({
    mutationFn: generateCourse,
  });

  return {
    mutate: mutation.mutate,
    data: mutation.data ?? null,
    error: mutation.error instanceof HttpError ? mutation.error : null,
    isPending: mutation.isPending,
    reset: mutation.reset,
  };
}
