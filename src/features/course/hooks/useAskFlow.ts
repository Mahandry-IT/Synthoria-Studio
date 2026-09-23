"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { generateCourse, generateCourseFromPlan, generateCoursePlan } from "../course.api";
import {
  LAST_COURSE_ID_STORAGE_KEY,
  PENDING_PLAN_STORAGE_KEY,
  resolveAskPhase,
  type AskPhase,
  type PendingPlan,
} from "../askFlow";
import type { QuestionInputValues } from "../course.schema";
import type {
  CourseGenerationResponse,
  CoursePlanRequest,
  PlannedSection,
} from "../course.types";
import { useEnqueuePodcast } from "@/features/podcast/hooks/useEnqueuePodcast";
import { toastError, toastSuccess, toastWarning } from "@/shared/ui/toast";
import { useSessionStorageState } from "@/shared/hooks/useSessionStorageState";
import { useOpenCourse } from "./useOpenCourse";

/** Écran affiché : le formulaire de question, ou le plan à valider. */
export type AskView = "form" | "result";

interface UseAskFlowReturn {
  phase: AskPhase;
  view: AskView;
  pendingPlan: PendingPlan | null;
  /** Génération du plan en cours */
  isPlanning: boolean;
  /** Génération du cours complet en cours (depuis le plan ou en direct) */
  isGenerating: boolean;
  /** Vérification du dernier cours avant d'ouvrir sa page */
  isOpeningCourse: boolean;
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
  /** Retourne au plan laissé en attente */
  showResult: () => void;
  /** Ouvre la page du dernier cours généré, après avoir vérifié qu'il existe encore */
  openLastCourse: () => void;
}

/**
 * Orchestre le flux de la page /ask : question → plan (revue/édition) → cours.
 * Le cours généré n'est pas gardé ici : on redirige vers sa page (/history/[id]) et seul son id
 * est mémorisé (sessionStorage) pour « Revoir le cours ». Le plan en attente y est aussi persisté.
 * Un plan reste en attente tant que le cours n'a pas été généré : un échec de
 * génération (ou un plan expiré) permet de réessayer ou de régénérer le plan.
 */
export function useAskFlow(): UseAskFlowReturn {
  const router = useRouter();
  const [lastCourseId, setLastCourseId] = useSessionStorageState<string>(LAST_COURSE_ID_STORAGE_KEY, null);
  const [pendingPlan, setPendingPlan] = useSessionStorageState<PendingPlan>(PENDING_PLAN_STORAGE_KEY, null);
  const enqueuePodcast = useEnqueuePodcast();
  const openCourse = useOpenCourse(() => setLastCourseId(null));
  const [lastRequest, setLastRequest] = useState<CoursePlanRequest | null>(null);
  const [view, setView] = useState<AskView>(() => (pendingPlan ? "result" : "form"));

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
    setPendingPlan(null);
    setView("form");
    if (!data.session_id) {
      toastWarning("Le cours a été généré mais n'a pas pu être enregistré : impossible de l'ouvrir.");
      return;
    }
    setLastCourseId(data.session_id);
    toastSuccess("Cours généré avec succès !");
    // Podcast parallèle, suivi sur la page du cours : sans job créé par le backend, on le lance ici.
    if (!data.podcast_job_id) enqueuePodcast.mutate({ sessionId: data.session_id });
    router.push(`/history/${data.session_id}`);
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
    setLastCourseId(null);
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
    phase: resolveAskPhase(pendingPlan, lastCourseId),
    view,
    pendingPlan,
    isPlanning: planMutation.isPending,
    isGenerating: fromPlanMutation.isPending || directMutation.isPending,
    isOpeningCourse: openCourse.isPending,
    planFailed: planMutation.isError,
    submitQuestion,
    validatePlan,
    regeneratePlan,
    generateDirect,
    reset,
    backToForm: () => setView("form"),
    showResult: () => setView("result"),
    openLastCourse: () => {
      if (lastCourseId) openCourse.mutate(lastCourseId);
    },
  };
}
