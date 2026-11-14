import { Button } from "@/components/Button";

interface ChartStepControlsProps {
  /** Étape courante, 0-based. */
  index: number;
  total: number;
  /** Légende de l'étape (texte non fiable : affiché tel quel). */
  caption: string;
  onPrevious: () => void;
  onNext: () => void;
}

/** Pas-à-pas d'un graphique : légende annoncée aux lecteurs d'écran, puis Précédent / Suivant. */
export function ChartStepControls({ index, total, caption, onPrevious, onNext }: ChartStepControlsProps) {
  if (total <= 0) return null;
  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="font-mono text-xs font-medium text-primary">
        Étape {index + 1}/{total}
      </p>
      <p aria-live="polite" className="mt-1 min-h-10 text-sm text-ink">
        {caption}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={index <= 0} onClick={onPrevious}>
          ← Précédent
        </Button>
        <Button type="button" disabled={index >= total - 1} onClick={onNext}>
          Suivant →
        </Button>
      </div>
    </div>
  );
}
