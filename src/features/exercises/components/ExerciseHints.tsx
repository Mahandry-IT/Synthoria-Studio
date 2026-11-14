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
      <h4 id="exercise-hints-title" className="font-serif text-base font-medium text-ink">
        Indices
      </h4>
      {shown.length > 0 && (
        <ol className="space-y-2" aria-live="polite">
          {shown.map((hint, i) => (
            <li key={i} className="rounded-card border-l-[3px] border-accent bg-primary-soft p-3 text-sm text-ink">
              <span className="font-mono text-xs font-semibold text-primary">Indice {i + 1} : </span>
              <RichText text={hint} />
            </li>
          ))}
        </ol>
      )}
      {hasMoreHints(hints, revealed) ? (
        <Button type="button" variant="secondary" onClick={onReveal}>
          Indice suivant ({revealed}/{hints.length})
        </Button>
      ) : (
        <p className="text-xs text-ink-3">Tous les indices sont affichés.</p>
      )}
    </section>
  );
}
