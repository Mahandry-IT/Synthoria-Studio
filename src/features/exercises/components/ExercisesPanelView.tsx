import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ProgressBar } from "@/components/ProgressBar";
import type { ExerciseList } from "../exercise.types";

interface ExercisesPanelViewProps {
  /** `undefined` tant que le premier relevé n'est pas arrivé. */
  data: ExerciseList | undefined;
  loadError?: string | null;
  launching?: boolean;
  /** Titre des sections du cours, par identifiant, pour nommer la section liée. */
  sectionTitles: Readonly<Record<string, string>>;
  onGenerate: () => void;
  /** Relance la lecture après une erreur de chargement. */
  onRetryLoad?: () => void;
  /** Ouvre l'exercice choisi (carte « avant »). */
  onOpen?: (exerciseId: string) => void;
  /** Message au-dessus de la liste (ex. exercice introuvable). */
  notice?: string | null;
}

const BOX = "rounded-card border border-dashed border-line-strong bg-surface p-6 text-center text-sm text-ink-2";

/**
 * Contenu de l'onglet « Exercices corrigés » (présentation pure, texte seulement).
 * Ne reçoit jamais d'énoncé : la liste n'en contient pas (RG-8).
 */
export function ExercisesPanelView({
  data,
  loadError,
  launching = false,
  sectionTitles,
  onGenerate,
  onRetryLoad,
  onOpen,
  notice,
}: ExercisesPanelViewProps) {
  if (!data) {
    return loadError ? (
      <div role="alert" className={BOX}>
        <p>{loadError}</p>
        {onRetryLoad && (
          <div className="mt-3 flex justify-center">
            <Button type="button" variant="secondary" onClick={onRetryLoad}>
              Réessayer
            </Button>
          </div>
        )}
      </div>
    ) : (
      <p role="status" className={BOX}>
        Chargement des exercices…
      </p>
    );
  }

  switch (data.status) {
    case "absent":
      return (
        <EmptyState
          title="Aucun exercice n'a encore été généré pour ce cours."
          action={
            <Button type="button" loading={launching} onClick={onGenerate}>
              Générer les exercices
            </Button>
          }
        />
      );
    case "pending":
    case "generating":
      return (
        <div role="status" aria-live="polite" className={BOX}>
          <p className="font-medium text-ink">
            {data.status === "pending" ? "Génération en attente…" : "Génération des exercices en cours…"}
          </p>
          <p className="mt-1">Cette page se met à jour toute seule.</p>
          <ProgressBar label="Génération des exercices en cours" className="mx-auto mt-3 max-w-xs" />
        </div>
      );
    case "failed":
      return (
        <div role="alert" className="rounded-card border border-err bg-err-soft p-6 text-center text-sm text-ink">
          <p>{data.error_message ?? "La génération des exercices a échoué."}</p>
          <div className="mt-3 flex justify-center">
            <Button type="button" variant="secondary" loading={launching} onClick={onGenerate}>
              Réessayer
            </Button>
          </div>
        </div>
      );
    case "done":
      if (data.exercises.length === 0) {
        return <EmptyState title="Ce cours ne demande aucun exercice supplémentaire." />;
      }
      return (
        <div className="space-y-3">
          {notice && (
            <p role="alert" className="rounded-card border border-warn bg-warn-soft p-3 text-sm text-ink">
              {notice}
            </p>
          )}
          <ol className="space-y-3" aria-label="Exercices corrigés">
            {[...data.exercises]
              .sort((a, b) => a.position - b.position)
              .map((exercise) => {
                const section = exercise.section_id ? sectionTitles[exercise.section_id] : undefined;
                const content = (
                  <>
                    <span className="block font-serif text-base font-medium text-ink">{exercise.title}</span>
                    {section && <span className="mt-0.5 block text-xs font-medium text-primary">Section : {section}</span>}
                    {exercise.covers && <span className="mt-1 block text-sm text-ink-2">{exercise.covers}</span>}
                    {exercise.duration_minutes !== null && (
                      <span className="mt-1 block font-mono text-xs text-ink-3">Durée prévue : {exercise.duration_minutes} min</span>
                    )}
                  </>
                );
                return (
                  <li key={exercise.id}>
                    {onOpen ? (
                      <button
                        type="button"
                        onClick={() => onOpen(exercise.id)}
                        className="block min-h-11 w-full rounded-card border border-line bg-surface p-4 text-left shadow-paper transition-shadow duration-(--d-fast) hover:border-primary hover:shadow-lift motion-reduce:transition-none"
                      >
                        {content}
                      </button>
                    ) : (
                      <div className="rounded-card border border-line bg-surface p-4 shadow-paper">{content}</div>
                    )}
                  </li>
                );
              })}
          </ol>
        </div>
      );
  }
}
