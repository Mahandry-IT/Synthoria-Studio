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
  /** Ouvre l'exercice choisi (carte « avant »). */
  onOpen?: (exerciseId: string) => void;
  /** Message au-dessus de la liste (ex. exercice introuvable). */
  notice?: string | null;
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
        <div className="space-y-3">
          {notice && (
            <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
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
                    <span className="block text-sm font-semibold text-gray-900">{exercise.title}</span>
                    {section && <span className="mt-0.5 block text-xs text-indigo-700">Section : {section}</span>}
                    {exercise.covers && <span className="mt-1 block text-sm text-gray-600">{exercise.covers}</span>}
                    {exercise.duration_minutes !== null && (
                      <span className="mt-1 block text-xs text-gray-500">Durée prévue : {exercise.duration_minutes} min</span>
                    )}
                  </>
                );
                return (
                  <li key={exercise.id}>
                    {onOpen ? (
                      <button
                        type="button"
                        onClick={() => onOpen(exercise.id)}
                        className="block min-h-11 w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        {content}
                      </button>
                    ) : (
                      <div className="rounded-lg border border-gray-200 bg-white p-4">{content}</div>
                    )}
                  </li>
                );
              })}
          </ol>
        </div>
      );
  }
}
