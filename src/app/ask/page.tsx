"use client";

import { useEffect } from "react";
import { QuestionInput } from "@/features/course/components/QuestionInput";
import { CourseView } from "@/features/course/components/CourseView";
import { PlanReview } from "@/features/course/components/PlanReview";
import { Skeleton } from "@/components/Skeleton";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useAskFlow } from "@/features/course/hooks/useAskFlow";

/**
 * Page de question + génération de cours en deux temps :
 * question → plan (relu/édité par l'utilisateur) → cours complet.
 * Le formulaire et le résultat (plan ou cours) sont deux écrans distincts :
 * on peut revenir au formulaire, le plan/cours en cours est alors conservé.
 */
export default function AskPage() {
  const flow = useAskFlow();
  const isBusy = flow.isPlanning || flow.isGenerating;
  const showResult = flow.view === "result" && flow.phase !== "question";

  // Changement d'écran : repartir du haut de la page
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [showResult]);

  if (showResult) {
    return (
      <div className="space-y-6">
        <div>
          <Button type="button" variant="ghost" onClick={flow.backToForm} disabled={isBusy}>
            ← Retour au formulaire
          </Button>
        </div>

        {flow.isPlanning && (
          <div className="space-y-4" role="status" aria-live="polite">
            <p className="text-sm text-gray-500">Génération du plan du cours…</p>
            <Skeleton lines={2} />
            <Skeleton lines={3} />
          </div>
        )}

        {flow.phase === "plan_review" && flow.pendingPlan && !flow.isPlanning && (
          <PlanReview
            key={flow.pendingPlan.plan.plan_id}
            plan={flow.pendingPlan.plan}
            onValidate={flow.validatePlan}
            onRegenerate={flow.regeneratePlan}
            isGenerating={flow.isGenerating}
          />
        )}

        {flow.isGenerating && <CourseGenerationLoader />}

        {flow.phase === "course" && flow.course && <CourseView data={flow.course} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Poser une question
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Demandez une explication sur un sujet. Vous pouvez sélectionner
          des fichiers ingestés comme contexte. Un plan du cours vous est
          d&apos;abord proposé : vous pouvez le valider ou le modifier.
        </p>
      </div>

      {flow.phase !== "question" && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-gray-700">
            {flow.phase === "plan_review"
              ? "Un plan de cours est en attente de validation."
              : "Votre dernier cours est disponible."}
          </p>
          <Button type="button" variant="secondary" onClick={flow.showResult} disabled={isBusy}>
            {flow.phase === "plan_review" ? "Reprendre le plan" : "Revoir le cours"}
          </Button>
        </Card>
      )}

      <Card className="p-5">
        <QuestionInput onSubmit={flow.submitQuestion} isPending={isBusy} />
      </Card>

      {flow.isPlanning && (
        <div className="space-y-4" role="status" aria-live="polite">
          <p className="text-sm text-gray-500">Génération du plan du cours…</p>
          <Skeleton lines={2} />
          <Skeleton lines={3} />
        </div>
      )}

      {flow.planFailed && !flow.isPlanning && flow.phase === "question" && (
        <Card className="space-y-3 p-5">
          <p className="text-sm text-gray-700">
            Le plan n&apos;a pas pu être généré. Vous pouvez réessayer ou générer
            directement le cours, sans étape de validation du plan.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={flow.regeneratePlan}>
              Réessayer le plan
            </Button>
            <Button type="button" variant="ghost" onClick={flow.generateDirect}>
              Générer directement le cours
            </Button>
          </div>
        </Card>
      )}

      {flow.isGenerating && <CourseGenerationLoader />}
    </div>
  );
}

function CourseGenerationLoader() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <p className="text-sm text-gray-500">
        Génération du cours en cours : les sections sont rédigées par lots, cela peut prendre
        plusieurs minutes.
      </p>
      <Skeleton lines={2} />
      <Skeleton lines={4} />
      <Skeleton lines={3} />
    </div>
  );
}
