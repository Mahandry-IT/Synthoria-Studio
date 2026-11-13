"use client";

import { useExercises } from "../hooks/useExercises";
import { useGenerateExercises } from "../hooks/useGenerateExercises";
import { ExercisesPanelView } from "./ExercisesPanelView";
import { resolveErrorMessage } from "@/shared/api/errors";

interface ExercisesPanelProps {
  sessionId: string | null;
  sectionTitles: Readonly<Record<string, string>>;
}

/** Onglet « Exercices corrigés » : suivi de la génération et liste des exercices. */
export function ExercisesPanel({ sessionId, sectionTitles }: ExercisesPanelProps) {
  const query = useExercises(sessionId);
  const generate = useGenerateExercises(sessionId);

  if (!sessionId) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
        Les exercices ne sont pas disponibles pour ce cours.
      </p>
    );
  }

  return (
    <ExercisesPanelView
      data={query.data}
      loadError={query.error ? resolveErrorMessage(query.error) : null}
      launching={generate.isPending}
      sectionTitles={sectionTitles}
      onGenerate={() => generate.mutate()}
      onRetryLoad={() => void query.refetch()}
    />
  );
}
