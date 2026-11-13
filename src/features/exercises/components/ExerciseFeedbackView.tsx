import { Button } from "@/components/Button";
import { RichText } from "@/features/course/components/RichText";
import type { ExerciseFeedback } from "../exercise.types";

interface ExerciseFeedbackViewProps {
  feedback: ExerciseFeedback;
  onRedo: () => void;
}

function PointList({ title, points, tone }: { title: string; points: string[]; tone: string }) {
  if (points.length === 0) return null;
  return (
    <div className={`rounded-lg p-3 ${tone}`}>
      <p className="font-semibold">{title}</p>
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
      <h4 id="exercise-feedback-title" tabIndex={-1} className="text-sm font-semibold text-gray-900">
        Correction
      </h4>
      {feedback.feedback && (
        <div className="rounded-lg bg-gray-50 p-3 text-gray-800">
          <RichText text={feedback.feedback} />
        </div>
      )}
      <PointList title="Ce qui est juste" points={feedback.correct_points} tone="bg-green-50 text-green-900" />
      <PointList title="Ce qui manque" points={feedback.missing_points} tone="bg-amber-50 text-amber-900" />
      {feedback.expected_approach && (
        <div className="rounded-lg bg-indigo-50 p-3 text-indigo-900">
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
