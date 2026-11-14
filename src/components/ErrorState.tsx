"use client";

import { Button } from "@/components/Button";
import { HttpError } from "@/shared/api/httpClient";
import { resolveErrorMessage } from "@/shared/api/errors";

interface ErrorStateProps {
  error: HttpError | Error | null;
  onRetry?: () => void;
}

/**
 * Affiche un état d'erreur avec mapping visuel par code HTTP.
 * Message actionnable selon le type d'erreur backend.
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  if (!error) return null;

  const status = error instanceof HttpError ? error.status : 0;
  const message = resolveErrorMessage(error);

  const iconColor = status >= 500 ? "text-err" : "text-warn";

  return (
    <div className="rounded-card border border-err bg-err-soft p-6">
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
          <h3 className="text-sm font-semibold text-err">{status ? `Erreur ${status}` : "Erreur"}</h3>
          <p className="mt-1 text-sm text-ink">{message}</p>
        </div>
      </div>
      {onRetry && (
        <div className="mt-4">
          <Button type="button" variant="secondary" onClick={onRetry}>
            Réessayer
          </Button>
        </div>
      )}
    </div>
  );
}
