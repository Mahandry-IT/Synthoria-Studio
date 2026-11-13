import { Button } from "@/components/Button";
import type { ExerciseSummary } from "../exercise.types";
import { EXERCISE_BEFORE_TITLE_ID } from "../exerciseSession";

interface ExerciseBeforeCardProps {
  /** Résumé de la liste : ne porte jamais l'énoncé ni les indices (RG-8). */
  exercise: ExerciseSummary;
  sectionTitle?: string;
  onStart: () => void;
}

/** Carte « avant » : titre, section, ce que couvre l'exercice et durée ; l'énoncé n'apparaît qu'après « Commencer ». */
export function ExerciseBeforeCard({ exercise, sectionTitle, onStart }: ExerciseBeforeCardProps) {
  return (
    <section aria-labelledby={EXERCISE_BEFORE_TITLE_ID} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className="space-y-2">
        <h3 id={EXERCISE_BEFORE_TITLE_ID} tabIndex={-1} className="text-base focus:outline-none font-semibold text-gray-900">
          {exercise.title}
        </h3>
        {sectionTitle && <p className="text-xs text-indigo-700">Section : {sectionTitle}</p>}
        {exercise.covers && (
          <p className="text-sm text-gray-700">
            <span className="font-medium">Ce que couvre l&apos;exercice : </span>
            {exercise.covers}
          </p>
        )}
        {exercise.duration_minutes !== null && (
          <p className="text-sm text-gray-600">Durée prévue : {exercise.duration_minutes} min</p>
        )}
      </div>
      <p className="text-xs text-gray-500">
        L&apos;énoncé s&apos;affiche quand vous commencez ; le minuteur démarre alors.
      </p>
      <Button type="button" onClick={onStart}>
        Commencer
      </Button>
    </section>
  );
}
