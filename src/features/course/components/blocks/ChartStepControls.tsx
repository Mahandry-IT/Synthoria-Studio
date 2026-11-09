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
    <div className="mt-3 border-t border-gray-100 pt-3">
      <p className="text-xs font-semibold text-indigo-600">
        Étape {index + 1}/{total}
      </p>
      <p aria-live="polite" className="mt-1 min-h-10 text-sm text-gray-700">
        {caption}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={index <= 0} onClick={onPrevious}>
          ← Précédent
        </Button>
        <Button type="button" size="sm" disabled={index >= total - 1} onClick={onNext}>
          Suivant →
        </Button>
      </div>
    </div>
  );
}
