"use client";

import { useEffect } from "react";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { QuestionInput } from "@/features/course/components/QuestionInput";
import { PlanReview } from "@/features/course/components/PlanReview";
import { LoadingModal } from "@/components/LoadingModal";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { AskStepper } from "@/features/course/components/AskStepper";
import { askStep } from "@/features/course/askFlow";
import { useAskFlow } from "@/features/course/hooks/useAskFlow";

/**
 * Page de question + génération de cours en deux temps :
 * question → plan (relu/édité par l'utilisateur) → cours complet.
 * Le formulaire et le plan à valider sont deux écrans distincts : on peut revenir au formulaire,
 * le plan est alors conservé. Une fois généré, le cours s'ouvre sur sa propre page (/history/[id]).
 */
export default function AskPage() {
  const flow = useAskFlow();
  const isBusy = flow.isPlanning || flow.isGenerating || flow.isOpeningCourse;
  const showResult = flow.view === "result" && (flow.phase === "plan_review" || flow.isLoadingPlan);
  const step = askStep(flow.phase, flow.isGenerating, flow.isLoadingPlan);

  // Modals d'attente, communs aux deux écrans : plan → cours
  const loadingModals = (
    <>
      <LoadingModal
        open={flow.isPlanning}
        icon={<ChecklistIcon sx={{ fontSize: 32 }} />}
        title="Génération du plan"
        message="Nous préparons le plan de votre cours, cela ne devrait prendre que quelques instants…"
      />
      <LoadingModal
        open={flow.isGenerating}
        icon={<AutoStoriesIcon sx={{ fontSize: 32 }} />}
        title="Génération du cours"
        message="Les sections sont rédigées par lots, cela peut prendre plusieurs minutes. Merci de patienter…"
      />
    </>
  );

  // Changement d'écran : repartir du haut de la page
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [showResult]);

  const resultScreen = (
    <div className="space-y-6">
      <h1 className="sr-only">Plan du cours</h1>
      <AskStepper step={step} />
      <div>
        <Button
          type="button"
          variant="secondary"
          onClick={flow.backToForm}
          disabled={isBusy}
        >
          ← Retour au formulaire
        </Button>
      </div>

      {flow.isLoadingPlan && (
        <div role="status" aria-busy="true">
          <p className="mb-3 text-sm text-ink-2">Chargement du plan…</p>
          <Skeleton lines={4} aria-hidden="true" />
        </div>
      )}

      {flow.pendingPlan && !flow.isPlanning && (
        <PlanReview
          key={flow.pendingPlan.plan.plan_id}
          plan={flow.pendingPlan.plan}
          onValidate={flow.validatePlan}
          onRegenerate={flow.regeneratePlan}
          isGenerating={flow.isGenerating}
        />
      )}
    </div>
  );

  const formScreen = (
    <div className="space-y-6">
      <PageHeader
        kicker="Nouveau cours"
        title="Poser une question"
        description="Demandez une explication sur un sujet. Vous pouvez sélectionner des fichiers ingestés comme contexte. Un plan du cours vous est d'abord proposé : vous pouvez le valider ou le modifier."
      />

      <AskStepper step={step} />

      {flow.phase !== "question" && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-ink">
            {flow.phase === "plan_review"
              ? "Un plan de cours est en attente de validation."
              : "Votre dernier cours est disponible."}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={flow.phase === "plan_review" ? flow.showResult : flow.openLastCourse}
            disabled={isBusy}
            loading={flow.isOpeningCourse}
          >
            {flow.phase === "plan_review"
              ? "Reprendre le plan"
              : "Revoir le cours"}
          </Button>
        </Card>
      )}

      <Card className="p-5">
        <QuestionInput onSubmit={flow.submitQuestion} isPending={isBusy} />
      </Card>

      {flow.planFailed && !flow.isPlanning && flow.phase === "question" && (
        <div role="alert" className="space-y-3 rounded-card border border-err bg-err-soft p-5">
          <p className="text-sm text-ink">
            Le plan n&apos;a pas pu être généré. Vous pouvez réessayer ou
            générer directement le cours, sans étape de validation du plan.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={flow.regeneratePlan}
            >
              Réessayer le plan
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={flow.generateDirect}
            >
              Générer directement le cours
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Les modals sont montés hors des écrans : changer d'écran ne réinitialise pas leur état
  return (
    <>
      {showResult ? resultScreen : formScreen}
      {loadingModals}
    </>
  );
}
