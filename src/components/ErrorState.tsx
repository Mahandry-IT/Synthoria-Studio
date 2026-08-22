"use client";

import { ERROR_MESSAGES } from "@/features/course/course.types";
import { HttpError } from "@/shared/api/httpClient";

interface ErrorStateProps {
  error: HttpError | Error | null;
  onRetry?: () => void;
}

const DEFAULT_MESSAGE = "Une erreur inattendue est survenue. Veuillez réessayer.";

/**
 * Affiche un état d'erreur avec mapping visuel par code HTTP.
 * Message actionnable selon le type d'erreur backend.
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  if (!error) return null;

  const status = error instanceof HttpError ? error.status : 0;
  const message = (status in ERROR_MESSAGES)
    ? ERROR_MESSAGES[status]
    : error.message || DEFAULT_MESSAGE;

  const iconColor = status >= 500 ? "text-red-500" : "text-amber-500";

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <svg
          className={`mt-0.5 h-5 w-5 flex-shrink-0 ${iconColor}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900">
            {status ? `Erreur ${status}` : "Erreur"}
          </h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
      </div>
      {onRetry && (
        <div className="mt-4">
          <button
            onClick={onRetry}
            className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 transition-colors hover:bg-red-200"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
