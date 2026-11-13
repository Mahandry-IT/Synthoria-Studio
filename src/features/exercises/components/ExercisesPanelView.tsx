import { Button } from "@/components/Button";
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
}

const BOX = "rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600";

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
        <div className={BOX}>
          <p>Aucun exercice n&apos;a encore été généré pour ce cours.</p>
          <div className="mt-3 flex justify-center">
            <Button type="button" loading={launching} onClick={onGenerate}>
              Générer les exercices
            </Button>
          </div>
        </div>
      );
    case "pending":
    case "generating":
      return (
        <div role="status" aria-live="polite" className={BOX}>
          <p className="font-medium text-gray-800">
            {data.status === "pending" ? "Génération en attente…" : "Génération des exercices en cours…"}
          </p>
          <p className="mt-1">Cette page se met à jour toute seule.</p>
        </div>
      );
    case "failed":
      return (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800">
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
        return <p className={BOX}>Ce cours ne demande aucun exercice supplémentaire.</p>;
      }
      return (
        <ol className="space-y-3" aria-label="Exercices corrigés">
          {[...data.exercises]
            .sort((a, b) => a.position - b.position)
            .map((exercise) => {
              const section = exercise.section_id ? sectionTitles[exercise.section_id] : undefined;
              return (
                <li key={exercise.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-900">{exercise.title}</h3>
                  {section && <p className="mt-0.5 text-xs text-indigo-700">Section : {section}</p>}
                  {exercise.covers && <p className="mt-1 text-sm text-gray-600">{exercise.covers}</p>}
                </li>
              );
            })}
        </ol>
      );
  }
}
