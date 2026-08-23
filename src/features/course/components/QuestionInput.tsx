"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/Button";
import { FileList } from "@/features/ingestion/components/FileList";
import { COURSE_QUESTION_MAX_LENGTH } from "@/shared/utils/constants";
import { questionInputSchema } from "../course.schema";
import type { QuestionInputValues } from "../course.schema";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
    </svg>
  );
}

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
  const [search, setSearch] = useState("");
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
        <div className="flex items-center justify-between gap-3 mb-1">
          <p className="text-sm font-medium text-gray-700">
            Fichiers de contexte <span className="text-gray-400 font-normal">(optionnel)</span>
          </p>
          <div className="relative w-56">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher…"
              aria-label="Rechercher un fichier de contexte"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <FileList
          onSelect={setSelectedFiles}
          selected={selectedFiles}
          multi
          search={search}
        />
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
