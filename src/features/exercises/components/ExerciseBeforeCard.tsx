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
    <section aria-labelledby={EXERCISE_BEFORE_TITLE_ID} className="space-y-4 rounded-card border border-line bg-surface p-5 text-ink shadow-paper">
      <div className="space-y-2">
        <h3 id={EXERCISE_BEFORE_TITLE_ID} tabIndex={-1} className="font-serif text-xl font-medium focus:outline-none">
          {exercise.title}
        </h3>
        {sectionTitle && <p className="text-xs font-medium text-primary">Section : {sectionTitle}</p>}
        {exercise.covers && (
          <p className="text-sm text-ink-2">
            <span className="font-medium">Ce que couvre l&apos;exercice : </span>
            {exercise.covers}
          </p>
        )}
        {exercise.duration_minutes !== null && (
          <p className="font-mono text-xs text-ink-3">Durée prévue : {exercise.duration_minutes} min</p>
        )}
      </div>
      <p className="text-xs text-ink-3">
        L&apos;énoncé s&apos;affiche quand vous commencez ; le minuteur démarre alors.
      </p>
      <Button type="button" onClick={onStart}>
        Commencer
      </Button>
    </section>
  );
}
