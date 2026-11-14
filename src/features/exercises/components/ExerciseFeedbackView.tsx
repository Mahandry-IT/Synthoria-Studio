import { Button } from "@/components/Button";
import { RichText } from "@/features/course/components/RichText";
import type { ExerciseFeedback } from "../exercise.types";

interface ExerciseFeedbackViewProps {
  feedback: ExerciseFeedback;
  onRedo: () => void;
}

function PointList({ title, mark, points, tone }: { title: string; mark: string; points: string[]; tone: string }) {
  if (points.length === 0) return null;
  return (
    <div className={`rounded-card border-l-[3px] p-3 text-ink ${tone}`}>
      <p className="font-semibold">
        <span aria-hidden="true">{mark} </span>
        {title}
      </p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {points.map((point, i) => (
          <li key={i}>
            <RichText text={point} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Retour de correction : ce qui est juste, ce qui manque, démarche attendue. Aucun score (RG-1). */
export function ExerciseFeedbackView({ feedback, onRedo }: ExerciseFeedbackViewProps) {
  return (
    <section aria-labelledby="exercise-feedback-title" className="space-y-3 text-sm">
      <h4 id="exercise-feedback-title" tabIndex={-1} className="font-serif text-base font-medium text-ink">
        Correction
      </h4>
      {feedback.feedback && (
        <div className="rounded-card bg-sunken p-3 text-ink">
          <RichText text={feedback.feedback} />
        </div>
      )}
      <PointList title="Ce qui est juste" mark="✓" points={feedback.correct_points} tone="border-ok bg-ok-soft" />
      <PointList title="Ce qui manque" mark="⚠" points={feedback.missing_points} tone="border-warn bg-warn-soft" />
      {feedback.expected_approach && (
        <div className="rounded-card border-l-[3px] border-accent bg-primary-soft p-3 text-ink">
          <p className="font-semibold">Démarche attendue</p>
          <div className="mt-1">
            <RichText text={feedback.expected_approach} />
          </div>
        </div>
      )}
      <Button type="button" variant="secondary" onClick={onRedo}>
        Refaire l&apos;exercice
      </Button>
    </section>
  );
}
