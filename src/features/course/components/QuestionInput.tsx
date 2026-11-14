"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/Button";
import { Option } from "@/components/Check";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { ContextFilePicker } from "@/features/ingestion/components/ContextFilePicker";
import { COURSE_QUESTION_MAX_LENGTH } from "@/shared/utils/constants";
import { cx } from "@/shared/utils/cx";
import { questionInputSchema } from "../course.schema";
import type { QuestionInputValues } from "../course.schema";
import {
  COURSE_DEPTH_OPTIONS,
  DEFAULT_COURSE_DEPTH,
  isCourseDepth,
  shortDepthHelp,
  type CourseDepth,
} from "../courseDepth";

interface QuestionInputProps {
  onSubmit: (values: QuestionInputValues) => void;
  isPending: boolean;
}

/**
 * Champ de question (éditeur riche, Markdown) avec sélecteur de fichiers optionnel et compteur
 * de caractères (Markdown compris : c'est ce que le backend reçoit et limite).
 * Valide la question via Zod avant envoi. Deux colonnes sur grand écran : question et niveau de
 * détail à gauche (ordre de tabulation naturel), fichiers de contexte à droite.
 *
 * - Pas de `filename` → Mode 3 (recherche web)
 * - `filename` présent → Mode 2 (basé sur vos documents)
 */
export function QuestionInput({ onSubmit, isPending }: QuestionInputProps) {
  const [question, setQuestion] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [depth, setDepth] = useState<CourseDepth>(DEFAULT_COURSE_DEPTH);
  const [validationError, setValidationError] = useState<string | null>(null);

  const charCount = question.length;
  const isOverLimit = charCount > COURSE_QUESTION_MAX_LENGTH;
  const depthHelp = COURSE_DEPTH_OPTIONS.find((option) => option.value === depth)?.help ?? "";

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setValidationError(null);

      const values: QuestionInputValues = {
        question: question.trim(),
        filename: selectedFiles.length > 0 ? selectedFiles : undefined,
        depth,
      };

      const result = questionInputSchema.safeParse(values);
      if (!result.success) {
        setValidationError(result.error.issues[0]?.message ?? "Erreur de validation");
        return;
      }

      onSubmit(result.data);
    },
    [question, selectedFiles, depth, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="min-w-0 space-y-6">
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Votre question</p>
            <RichTextEditor
              id="question-input"
              ariaLabel="Votre question"
              value={question}
              onChange={setQuestion}
              placeholder="Posez votre question ici…"
              disabled={isPending}
              invalid={isOverLimit}
              minRows={4}
            />
            <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
              <span className={cx("font-mono", isOverLimit ? "font-medium text-err" : "text-ink-3")}>
                {charCount} / {COURSE_QUESTION_MAX_LENGTH}
              </span>
              {selectedFiles.length > 0 ? (
                <span className="text-primary">Mode 2 — basé sur vos documents</span>
              ) : (
                <span className="text-ink-3">Mode 3 — recherche web</span>
              )}
            </div>
          </div>

          <fieldset disabled={isPending} aria-describedby="course-depth-help" className="min-w-0">
            <legend className="mb-1.5 text-sm font-medium text-ink">Niveau de détail</legend>
            <div className="grid gap-2">
              {COURSE_DEPTH_OPTIONS.map((option) => (
                <Option
                  key={option.value}
                  id={`course-depth-${option.value}`}
                  name="course-depth"
                  value={option.value}
                  checked={depth === option.value}
                  onChange={(e) => {
                    if (isCourseDepth(e.target.value)) setDepth(e.target.value);
                  }}
                  label={
                    <>
                      <span className="block font-semibold">{option.label}</span>
                      <span className="mt-0.5 block text-xs text-ink-2">{shortDepthHelp(option.help)}</span>
                    </>
                  }
                />
              ))}
            </div>
            <p id="course-depth-help" className="mt-2 text-xs text-ink-2">
              {depthHelp}
            </p>
          </fieldset>
        </div>

        <div className="min-w-0">
          <ContextFilePicker selected={selectedFiles} onChange={setSelectedFiles} />
        </div>
      </div>

      {validationError && (
        <p role="alert" className="text-sm text-err">
          {validationError}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="accent"
          loading={isPending}
          disabled={!question.trim() || isOverLimit}
          className="w-full sm:w-auto"
        >
          Générer le cours
        </Button>
      </div>
    </form>
  );
}
