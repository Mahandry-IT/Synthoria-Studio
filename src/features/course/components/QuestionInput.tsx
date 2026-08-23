"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/Button";
import { FileList } from "@/features/ingestion/components/FileList";
import { COURSE_QUESTION_MAX_LENGTH } from "@/shared/utils/constants";
import { questionInputSchema } from "../course.schema";
import type { QuestionInputValues } from "../course.schema";

interface QuestionInputProps {
  onSubmit: (values: QuestionInputValues) => void;
  isPending: boolean;
}

/**
 * Champ de question avec sélecteur de fichiers optionnel et compteur de caractères.
 * Valide la question via Zod avant envoi.
 *
 * - Pas de `filename` → Mode 3 (recherche web)
 * - `filename` présent → Mode 2 (basé sur vos documents)
 */
export function QuestionInput({ onSubmit, isPending }: QuestionInputProps) {
  const [question, setQuestion] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const charCount = question.length;
  const isOverLimit = charCount > COURSE_QUESTION_MAX_LENGTH;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setValidationError(null);

      const values: QuestionInputValues = {
        question: question.trim(),
        filename: selectedFiles.length > 0 ? selectedFiles : undefined,
      };

      const result = questionInputSchema.safeParse(values);
      if (!result.success) {
        setValidationError(result.error.issues[0]?.message ?? "Erreur de validation");
        return;
      }

      onSubmit(result.data);
    },
    [question, selectedFiles, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="question-input" className="block text-sm font-medium text-gray-700 mb-1">
          Votre question
        </label>
        <textarea
          id="question-input"
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Posez votre question ici…"
          disabled={isPending}
          className={[
            "w-full rounded-lg border px-3 py-2 text-sm resize-none",
            "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
            "disabled:opacity-50",
            isOverLimit ? "border-red-300 focus:ring-red-500" : "border-gray-300",
          ].join(" ")}
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

      <div>
        <p className="block text-sm font-medium text-gray-700 mb-1">
          Fichiers de contexte <span className="text-gray-400 font-normal">(optionnel)</span>
        </p>
        <div className="max-h-48 overflow-y-auto">
          <FileList
            onSelect={setSelectedFiles}
            selected={selectedFiles}
            multi
          />
        </div>
        {selectedFiles.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            {selectedFiles.length} fichier(s) sélectionné(s)
          </p>
        )}
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
