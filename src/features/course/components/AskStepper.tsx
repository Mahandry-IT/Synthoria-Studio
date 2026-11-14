import { Stepper } from "@/components/Stepper";
import { ASK_STEP_LABELS } from "../askFlow";

/** Fil d'étapes de /ask : Sources, Plan, Cours. Le libellé visible complète les textes du `Stepper`. */
export function AskStepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="space-y-2">
      <p aria-hidden="true" className="kicker">
        Étape {step} sur {ASK_STEP_LABELS.length} · {ASK_STEP_LABELS[step - 1]}
      </p>
      <Stepper total={ASK_STEP_LABELS.length} current={step} label="Progression de la demande de cours" />
    </div>
  );
}
