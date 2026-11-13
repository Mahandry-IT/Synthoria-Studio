"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { useAnswerExercise } from "../hooks/useAnswerExercise";
import { useExerciseDetail } from "../hooks/useExerciseDetail";
import { focusAfterRender } from "@/features/course/components/SectionReader";
import { checkAnswer, clearDraft, createDraftWriter, readDraft } from "../exerciseAnswer";
import { EXERCISE_BEFORE_TITLE_ID, EXERCISE_TITLE_ID } from "../exerciseSession";
import { answerErrorMessage, detailError } from "../exerciseErrors";
import { nextHintCount } from "../exerciseHints";
import type { ExerciseDetail, ExerciseSummary } from "../exercise.types";
import { ExerciseAnswerForm } from "./ExerciseAnswerForm";
import { ExerciseBeforeCard } from "./ExerciseBeforeCard";
import { ExerciseFeedbackView } from "./ExerciseFeedbackView";
import { ExerciseHints } from "./ExerciseHints";
import { ExerciseStatement } from "./ExerciseStatement";
import { ExerciseTimer } from "./ExerciseTimer";

interface ExerciseSessionProps {
  sessionId: string;
  exercise: ExerciseSummary;
  sectionTitle?: string;
  onClose: () => void;
  /** Détail introuvable (404) : retour à la liste avec ce message. */
  onNotFound: (message: string) => void;
  /** Absent si l'exercice n'est lié à aucune section. */
  onBackToSection?: () => void;
}

/**
 * Un exercice : carte « avant » (sans énoncé), puis, après « Commencer », énoncé, minuteur, indices,
 * réponse et correction. « Refaire » ramène à la carte « avant » (énoncé masqué, minuteur et brouillon remis à zéro).
 */
export function ExerciseSession({
  sessionId,
  exercise,
  sectionTitle,
  onClose,
  onNotFound,
  onBackToSection,
}: ExerciseSessionProps) {
  const [started, setStarted] = useState(false);
  // Change à chaque « Refaire » : remonte l'exercice pour repartir d'un état neuf.
  const [attempt, setAttempt] = useState(0);

  function redo() {
    clearDraft(sessionId, exercise.id);
    setStarted(false);
    setAttempt((n) => n + 1);
    focusAfterRender(EXERCISE_BEFORE_TITLE_ID);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          ← Retour à la liste
        </Button>
        {onBackToSection && (
          <Button type="button" variant="ghost" size="sm" onClick={onBackToSection}>
            Retour à la section
          </Button>
        )}
      </div>
      {started ? (
        <ExerciseRun
          key={attempt}
          sessionId={sessionId}
          exercise={exercise}
          sectionTitle={sectionTitle}
          onNotFound={onNotFound}
          onRedo={redo}
        />
      ) : (
        <ExerciseBeforeCard exercise={exercise} sectionTitle={sectionTitle} onStart={() => setStarted(true)} />
      )}
    </div>
  );
}

interface ExerciseRunProps {
  sessionId: string;
  exercise: ExerciseSummary;
  sectionTitle?: string;
  onNotFound: (message: string) => void;
  onRedo: () => void;
}

/** Charge le détail (seulement après « Commencer ») puis affiche l'exercice. */
function ExerciseRun({ sessionId, exercise, sectionTitle, onNotFound, onRedo }: ExerciseRunProps) {
  const query = useExerciseDetail(sessionId, exercise.id, true);
  const failure = query.error ? detailError(query.error) : null;
  const notFoundMessage = failure?.kind === "not_found" ? failure.message : null;

  useEffect(() => {
    if (notFoundMessage) onNotFound(notFoundMessage);
  }, [notFoundMessage, onNotFound]);

  if (query.data) {
    return <ExerciseWorkspace sessionId={sessionId} detail={query.data} sectionTitle={sectionTitle} onRedo={onRedo} />;
  }
  if (failure && failure.kind === "retryable") {
    return (
      <div role="alert" className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        <p>{failure.message}</p>
        <Button type="button" variant="secondary" onClick={() => void query.refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }
  return (
    <p role="status" className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
      Chargement de l&apos;exercice…
    </p>
  );
}

interface ExerciseWorkspaceProps {
  sessionId: string;
  detail: ExerciseDetail;
  sectionTitle?: string;
  onRedo: () => void;
}

const FEEDBACK_HEADING_ID = "exercise-feedback-title";

function ExerciseWorkspace({ sessionId, detail, sectionTitle, onRedo }: ExerciseWorkspaceProps) {
  // Le minuteur démarre quand l'énoncé s'affiche (horloge monotone).
  const [startedAt] = useState(() => performance.now());
  const [answer, setAnswer] = useState(() => readDraft(sessionId, detail.id));
  const [hintCount, setHintCount] = useState(0);
  const mutation = useAnswerExercise(sessionId, detail.id);
  const feedback = mutation.data;
  const draftWriter = useMemo(() => createDraftWriter(sessionId, detail.id), [sessionId, detail.id]);

  // Énoncé affiché : le focus va à son titre ; le brouillon en attente est écrit au démontage.
  useEffect(() => {
    focusAfterRender(EXERCISE_TITLE_ID);
  }, []);
  useEffect(() => () => draftWriter.flush(), [draftWriter]);

  // Correction reçue : le focus va au titre du retour (lecteur d'écran et clavier).
  useEffect(() => {
    if (feedback) document.getElementById(FEEDBACK_HEADING_ID)?.focus();
  }, [feedback]);

  function handleChange(value: string) {
    setAnswer(value);
    draftWriter.write(value);
  }

  function submit() {
    if (!checkAnswer(answer, mutation.isPending).canSubmit) return;
    draftWriter.flush();
    // Le brouillon est effacé par la mutation elle-même (useAnswerExercise) au succès.
    mutation.mutate(answer);
  }

  return (
    <article aria-labelledby={EXERCISE_TITLE_ID} className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
      <header className="space-y-1">
        <h3 id={EXERCISE_TITLE_ID} tabIndex={-1} className="text-base focus:outline-none font-semibold text-gray-900">
          {detail.title}
        </h3>
        {sectionTitle && <p className="text-xs text-indigo-700">Section : {sectionTitle}</p>}
      </header>
      <ExerciseTimer startedAt={startedAt} durationMinutes={detail.duration_minutes} stopped={Boolean(feedback)} />
      <ExerciseStatement blocks={detail.statement} />
      {feedback ? (
        <ExerciseFeedbackView feedback={feedback} onRedo={onRedo} />
      ) : (
        <>
          <ExerciseHints
            hints={detail.hints}
            revealed={hintCount}
            onReveal={() => setHintCount((n) => nextHintCount(n, detail.hints.length))}
          />
          <ExerciseAnswerForm
            value={answer}
            onChange={handleChange}
            onSubmit={submit}
            pending={mutation.isPending}
            error={mutation.error ? answerErrorMessage(mutation.error) : null}
          />
        </>
      )}
    </article>
  );
}
