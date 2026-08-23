"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateCourse } from "../course.api";
import type { CourseGenerationRequest, CourseGenerationResponse } from "../course.types";
import { HttpError } from "@/shared/api/httpClient";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { useSessionStorageState } from "@/shared/hooks/useSessionStorageState";

const STORAGE_KEY = "synthoria:last-course";

interface UseGenerateCourseReturn {
  mutate: (payload: CourseGenerationRequest) => void;
  data: CourseGenerationResponse | null;
  error: HttpError | null;
  isPending: boolean;
  reset: () => void;
}

/**
 * Mutation React Query pour la génération de cours.
 * Le cours est persisté en sessionStorage pour survivre à un refresh.
 */
export function useGenerateCourse(): UseGenerateCourseReturn {
  const [persistedData, setPersistedData] = useSessionStorageState<CourseGenerationResponse>(
    STORAGE_KEY,
    null,
  );

  const mutation = useMutation({
    mutationFn: generateCourse,
    onSuccess: (data) => {
      setPersistedData(data);
      toastSuccess("Cours généré avec succès !");
    },
    onError: (err) => {
      toastError(err);
    },
  });

  const reset = useCallback(() => {
    setPersistedData(null);
    mutation.reset();
  }, [mutation, setPersistedData]);

  return {
    mutate: mutation.mutate,
    // Le cours mutation est prioritaire (pendant génération), puis le persisté (après refresh)
    data: mutation.data ?? persistedData,
    error: mutation.error instanceof HttpError ? mutation.error : null,
    isPending: mutation.isPending,
    reset,
  };
}
