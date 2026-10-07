"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/Button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { ContextFilePicker } from "@/features/ingestion/components/ContextFilePicker";
import { COURSE_QUESTION_MAX_LENGTH } from "@/shared/utils/constants";
import { questionInputSchema } from "../course.schema";
import type { QuestionInputValues } from "../course.schema";
import {
  COURSE_DEPTH_OPTIONS,
  DEFAULT_COURSE_DEPTH,
  isCourseDepth,
  type CourseDepth,
} from "../courseDepth";

interface QuestionInputProps {
  onSubmit: (values: QuestionInputValues) => void;
  isPending: boolean;
}

/**
 * Champ de question (éditeur riche, Markdown) avec sélecteur de fichiers optionnel et compteur
 * de caractères (Markdown compris : c'est ce que le backend reçoit et limite).
 * Valide la question via Zod avant envoi.
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-1">Votre question</p>
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
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className={isOverLimit ? "text-red-600 font-medium" : "text-gray-400"}>
            {charCount} / {COURSE_QUESTION_MAX_LENGTH}
          </span>
          {selectedFiles.length > 0 ? (
            <span className="text-indigo-600">
              Mode 2 — basé sur vos documents
            </span>
          ) : (
            <span className="text-gray-400">
              Mode 3 — recherche web
            </span>
          )}
        </div>
      </div>

      <ContextFilePicker selected={selectedFiles} onChange={setSelectedFiles} />

      <div>
        <label htmlFor="course-depth" className="block text-sm font-medium text-gray-700 mb-1">
          Niveau de détail
        </label>
        <select
          id="course-depth"
          value={depth}
          onChange={(e) => {
            if (isCourseDepth(e.target.value)) setDepth(e.target.value);
          }}
          disabled={isPending}
          aria-describedby="course-depth-help"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 sm:w-64"
        >
          {COURSE_DEPTH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p id="course-depth-help" className="mt-1 text-xs text-gray-500">
          {depthHelp}
        </p>
      </div>

      {validationError && (
        <p className="text-sm text-red-600">{validationError}</p>
      )}

      <Button
        type="submit"
        loading={isPending}
        disabled={!question.trim() || isOverLimit}
        className="w-full"
      >
        Générer le cours
      </Button>
    </form>
  );
}
