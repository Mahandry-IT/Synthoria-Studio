import { progressNow, progressPercent } from "@/shared/utils/uiState";

interface ProgressBarProps {
  /** Valeur courante ; absente = barre indéterminée (pas d'`aria-valuenow`). */
  value?: number | null;
  max?: number;
  /** Libellé accessible (obligatoire). */
  label: string;
  className?: string;
}

/**
 * Barre de progression de 6 px (`role="progressbar"`). Indéterminée sans `value` ;
 * l'animation est coupée sous `prefers-reduced-motion`.
 */
export function ProgressBar({ value, max = 100, label, className = "" }: ProgressBarProps) {
  const pct = progressPercent(value, max);
  const determinate = pct !== undefined;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={progressNow(value, max)}
      className={`h-1.5 overflow-hidden rounded-[3px] border border-line bg-sunken ${className}`}
    >
      <i
        className={`block h-full bg-primary ${
          determinate ? "transition-[width] duration-(--d-std) motion-reduce:transition-none" : "bar-indeterminate w-2/5"
        }`}
        style={determinate ? { width: `${pct}%` } : undefined}
      />
    </div>
  );
}
