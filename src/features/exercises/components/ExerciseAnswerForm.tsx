"use client";

import { Button } from "@/components/Button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { checkAnswer, EXERCISE_ANSWER_MAX_LENGTH } from "../exerciseAnswer";

interface ExerciseAnswerFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
  /** Message d'échec de la correction ; la réponse reste dans l'éditeur. */
  error?: string | null;
}

/** Zone de réponse (Markdown + LaTeX), limitée à 4000 caractères, un seul envoi à la fois. */
export function ExerciseAnswerForm({ value, onChange, onSubmit, pending, error }: ExerciseAnswerFormProps) {
  const { tooLong, canSubmit } = checkAnswer(value, pending);
  return (
    <form
      className="space-y-3"
      aria-labelledby="exercise-answer-title"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <h4 id="exercise-answer-title" className="font-serif text-base font-medium text-ink">
        Votre réponse
      </h4>
      <RichTextEditor
        ariaLabel="Votre réponse à l'exercice"
        value={value}
        onChange={onChange}
        minRows={8}
        invalid={tooLong}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`text-xs ${tooLong ? "font-medium text-err" : "text-ink-3"}`}>
          {value.length}/{EXERCISE_ANSWER_MAX_LENGTH}
          {tooLong && " : réponse trop longue, raccourcissez-la"}
        </span>
        <Button type="submit" loading={pending} disabled={!canSubmit}>
          {error ? "Renvoyer" : "Envoyer ma réponse"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="rounded-card border border-err bg-err-soft p-3 text-sm text-ink">
          {error}
        </p>
      )}
    </form>
  );
}
