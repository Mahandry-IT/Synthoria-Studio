import { STEP_STATE_LABEL, stepState, type StepState } from "@/shared/utils/uiState";

interface StepperProps {
  /** Nombre d'étapes. */
  total: number;
  /** Étape courante, de 1 à `total`. */
  current: number;
  /** Nom accessible de la liste (ex. « Progression du parcours »). */
  label: string;
  className?: string;
}

const SEGMENT_CLASSES: Record<StepState, string> = {
  done: "bg-primary",
  current: "bg-accent",
  todo: "bg-line",
};

/**
 * Indicateur d'étapes en segments de 4 px. L'état n'est pas porté par la seule couleur :
 * chaque segment contient un texte pour lecteur d'écran, `aria-current="step"` marque l'étape courante.
 */
export function Stepper({ total, current, label, className = "" }: StepperProps) {
  const count = Math.max(1, Math.floor(total));

  return (
    <ol aria-label={label} className={`flex gap-1.5 ${className}`}>
      {Array.from({ length: count }, (_, i) => {
        const step = i + 1;
        const state = stepState(step, current, count);
        return (
          <li key={step} aria-current={state === "current" ? "step" : undefined} className="flex-1">
            <span className={`block h-1 rounded-full ${SEGMENT_CLASSES[state]}`} />
            <span className="sr-only">{`Étape ${step} sur ${count} : ${STEP_STATE_LABEL[state]}`}</span>
          </li>
        );
      })}
    </ol>
  );
}
