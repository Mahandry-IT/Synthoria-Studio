import { BlockRenderer } from "@/features/course/components/blocks/BlockRenderer";
import type { CourseContentBlock } from "@/features/course/course.types";

interface ExerciseStatementProps {
  blocks: CourseContentBlock[];
}

/**
 * Énoncé de l'exercice, rendu par les blocs du cours (texte, tableau, diagramme, graphique, widget
 * sandboxé) : jamais de HTML brut. Les blocs vides ou inconnus sont ignorés par `BlockRenderer`.
 */
export function ExerciseStatement({ blocks }: ExerciseStatementProps) {
  return (
    <section aria-labelledby="exercise-statement-title" className="space-y-3">
      <h4 id="exercise-statement-title" className="font-serif text-base font-medium text-ink">
        Énoncé
      </h4>
      {blocks.length === 0 ? (
        <p className="rounded-card border border-dashed border-line-strong p-4 text-sm text-ink-2">
          L&apos;énoncé de cet exercice est indisponible. Revenez à la liste et choisissez un autre exercice.
        </p>
      ) : (
        <div className="min-w-0 max-w-3xl space-y-3 overflow-x-auto font-serif text-base leading-relaxed text-ink">
          <BlockRenderer blocks={blocks} />
        </div>
      )}
    </section>
  );
}
