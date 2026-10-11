import { Button } from "@/components/Button";

interface GraphStepControlsProps {
  /** Étape courante, 0-based. */
  index: number;
  total: number;
  /** Explication de l'étape courante (texte non fiable : affiché tel quel, jamais interprété). */
  caption: string;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
}

/** Pas-à-pas d'un graphe : légende de l'étape annoncée aux lecteurs d'écran, puis Précédent / Suivant. */
export function GraphStepControls({ index, total, caption, onPrevious, onNext, onReset }: GraphStepControlsProps) {
  const isLast = index >= total - 1;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <p aria-live="polite" className="min-h-10 text-sm text-gray-700">
        <span className="mr-2 text-xs font-semibold text-indigo-600">
          Étape {index + 1} sur {total}
        </span>
        {caption}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={index === 0} onClick={onPrevious}>
          ← Précédent
        </Button>
        {isLast ? (
          <Button type="button" variant="secondary" size="sm" disabled={total < 2} onClick={onReset}>
            Recommencer
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={onNext}>
            Suivant →
          </Button>
        )}
      </div>
    </div>
  );
}
