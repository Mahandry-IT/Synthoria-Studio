"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateCourse, generateCourseFromPlan, generateCoursePlan } from "../course.api";
import { resolveAskPhase, type AskPhase, type PendingPlan } from "../askFlow";
import type { QuestionInputValues } from "../course.schema";
import type {
  CourseGenerationResponse,
  CoursePlanRequest,
  PlannedSection,
} from "../course.types";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { useSessionStorageState } from "@/shared/hooks/useSessionStorageState";

const COURSE_STORAGE_KEY = "synthoria:last-course";
const PENDING_PLAN_STORAGE_KEY = "synthoria:pending-plan";

/** Écran affiché : le formulaire de question, ou le résultat (plan à valider / cours). */
export type AskView = "form" | "result";

interface UseAskFlowReturn {
  phase: AskPhase;
  view: AskView;
  pendingPlan: PendingPlan | null;
  course: CourseGenerationResponse | null;
  /** Génération du plan en cours */
  isPlanning: boolean;
  /** Génération du cours complet en cours (depuis le plan ou en direct) */
  isGenerating: boolean;
  /** La génération du plan a échoué : la génération directe reste possible */
  planFailed: boolean;
  submitQuestion: (values: QuestionInputValues) => void;
  validatePlan: (sections: PlannedSection[]) => void;
  regeneratePlan: () => void;
  /** Repli : génère le cours en un seul appel, sans étape de plan */
  generateDirect: () => void;
  reset: () => void;
  /** Revient au formulaire sans perdre le plan ou le cours en cours */
  backToForm: () => void;
  /** Retourne au plan ou au cours laissé en attente */
  showResult: () => void;
}

/**
 * Orchestre le flux de la page /ask : question → plan (revue/édition) → cours.
 * Plan en attente et cours sont persistés en sessionStorage pour survivre à un refresh.
 * Un plan reste en attente tant que le cours n'a pas été généré : un échec de
 * génération (ou un plan expiré) permet de réessayer ou de régénérer le plan.
 */
export function useAskFlow(): UseAskFlowReturn {
  const [course, setCourse] = useSessionStorageState<CourseGenerationResponse>(COURSE_STORAGE_KEY, null);
  const [pendingPlan, setPendingPlan] = useSessionStorageState<PendingPlan>(PENDING_PLAN_STORAGE_KEY, null);
  const [lastRequest, setLastRequest] = useState<CoursePlanRequest | null>(null);
  const [view, setView] = useState<AskView>(() =>
    resolveAskPhase(pendingPlan, course) === "question" ? "form" : "result",
  );

  const planMutation = useMutation({
    mutationFn: generateCoursePlan,
    onSuccess: (plan, request) => {
      setPendingPlan({ request, plan });
      setView("result");
      toastSuccess("Plan généré. Relisez-le, modifiez-le si besoin, puis validez.");
    },
    onError: toastError,
  });

  const onCourseGenerated = (data: CourseGenerationResponse) => {
    setCourse(data);
    setPendingPlan(null);
    setView("result");
    toastSuccess("Cours généré avec succès !");
  };

  const fromPlanMutation = useMutation({
    mutationFn: generateCourseFromPlan,
    onSuccess: onCourseGenerated,
    onError: toastError,
  });

  const directMutation = useMutation({
    mutationFn: generateCourse,
    onSuccess: onCourseGenerated,
    onError: toastError,
  });

  function reset() {
    setCourse(null);
    setPendingPlan(null);
    planMutation.reset();
    fromPlanMutation.reset();
    directMutation.reset();
  }

  function submitQuestion(values: QuestionInputValues) {
    const request: CoursePlanRequest = {
      question: values.question,
      filename: values.filename ?? undefined,
    };
    reset();
    setView("form");
    setLastRequest(request);
    planMutation.mutate(request);
  }

  function validatePlan(sections: PlannedSection[]) {
    if (!pendingPlan) return;
    fromPlanMutation.mutate({ plan_id: pendingPlan.plan.plan_id, sections });
  }

  function regeneratePlan() {
    const request = pendingPlan?.request ?? lastRequest;
    if (request) planMutation.mutate(request);
  }

  function generateDirect() {
    const request = lastRequest ?? pendingPlan?.request;
    if (!request) return;
    planMutation.reset();
    directMutation.mutate(request);
  }

  return {
    phase: resolveAskPhase(pendingPlan, course),
    view,
    pendingPlan,
    course,
    isPlanning: planMutation.isPending,
    isGenerating: fromPlanMutation.isPending || directMutation.isPending,
    planFailed: planMutation.isError,
    submitQuestion,
    validatePlan,
    regeneratePlan,
    generateDirect,
    reset,
    backToForm: () => setView("form"),
    showResult: () => setView("result"),
  };
}
