import { Button } from "@/components/Button";
import { RichText } from "@/features/course/components/RichText";
import { hasMoreHints, visibleHints } from "../exerciseHints";

interface ExerciseHintsProps {
  hints: readonly string[];
  revealed: number;
  onReveal: () => void;
}

/** Indices masqués, révélés un par un du général au précis. Sans indice, rien n'est affiché. */
export function ExerciseHints({ hints, revealed, onReveal }: ExerciseHintsProps) {
  if (hints.length === 0) return null;
  const shown = visibleHints(hints, revealed);
  return (
    <section aria-labelledby="exercise-hints-title" className="space-y-2">
      <h4 id="exercise-hints-title" className="text-sm font-semibold text-gray-900">
        Indices
      </h4>
      {shown.length > 0 && (
        <ol className="space-y-2" aria-live="polite">
          {shown.map((hint, i) => (
            <li key={i} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <span className="font-medium">Indice {i + 1} : </span>
              <RichText text={hint} />
            </li>
          ))}
        </ol>
      )}
      {hasMoreHints(hints, revealed) ? (
        <Button type="button" variant="secondary" size="sm" onClick={onReveal}>
          Indice suivant ({revealed}/{hints.length})
        </Button>
      ) : (
        <p className="text-xs text-gray-500">Tous les indices sont affichés.</p>
      )}
    </section>
  );
}
