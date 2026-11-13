"use client";

import { useCallback, useState } from "react";
import { useExercises } from "../hooks/useExercises";
import { useGenerateExercises } from "../hooks/useGenerateExercises";
import { ExercisesPanelView } from "./ExercisesPanelView";
import { ExerciseSession } from "./ExerciseSession";
import { resolveErrorMessage } from "@/shared/api/errors";

interface ExercisesPanelProps {
  sessionId: string | null;
  sectionTitles: Readonly<Record<string, string>>;
  /** Exercice ouvert (état détenu par le cours : « Faire l'exercice » d'une section l'ouvre) ; `null` : la liste. */
  openExerciseId?: string | null;
  onOpenExercise?: (exerciseId: string | null) => void;
  /** « Retour à la section » : rouvre l'onglet Leçons sur cette section. */
  onBackToSection?: (sectionId: string) => void;
}

/** Onglet « Exercices corrigés » : suivi de la génération, liste des exercices, puis exercice ouvert. */
export function ExercisesPanel({
  sessionId,
  sectionTitles,
  openExerciseId = null,
  onOpenExercise = () => {},
  onBackToSection,
}: ExercisesPanelProps) {
  const query = useExercises(sessionId);
  const generate = useGenerateExercises(sessionId);
  const [notice, setNotice] = useState<string | null>(null);
  // Le message « introuvable » disparaît dès qu'un exercice s'ouvre (liste ou « Faire l'exercice »).
  const [previousOpenId, setPreviousOpenId] = useState(openExerciseId);
  if (previousOpenId !== openExerciseId) {
    setPreviousOpenId(openExerciseId);
    if (openExerciseId !== null) setNotice(null);
  }
  const handleNotFound = useCallback(
    (message: string) => {
      setNotice(message);
      onOpenExercise(null);
    },
    [onOpenExercise],
  );

  if (!sessionId) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
        Les exercices ne sont pas disponibles pour ce cours.
      </p>
    );
  }

  const open = query.data?.status === "done" ? query.data.exercises.find((e) => e.id === openExerciseId) : undefined;
  if (open) {
    const sectionId = open.section_id;
    return (
      <ExerciseSession
        key={open.id}
        sessionId={sessionId}
        exercise={open}
        sectionTitle={sectionId ? sectionTitles[sectionId] : undefined}
        onClose={() => onOpenExercise(null)}
        onNotFound={handleNotFound}
        onBackToSection={sectionId && onBackToSection ? () => onBackToSection(sectionId) : undefined}
      />
    );
  }

  return (
    <ExercisesPanelView
      data={query.data}
      loadError={query.error ? resolveErrorMessage(query.error) : null}
      launching={generate.isPending}
      sectionTitles={sectionTitles}
      notice={notice}
      onOpen={onOpenExercise}
      onGenerate={() => generate.mutate()}
      onRetryLoad={() => void query.refetch()}
    />
  );
}
