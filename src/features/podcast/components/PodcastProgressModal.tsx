"use client";

import { useRef } from "react";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { Button } from "@/components/Button";
import { CircularProgressRing } from "@/components/CircularProgressRing";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";
import { PODCAST_STAGES, stageLabel } from "../podcast.progress";

interface PodcastProgressModalProps {
  /** 0-100 */
  progress: number;
  /** Étape en cours (libellé français). */
  label: string;
  /** Index de l'étape en cours (-1 : pas commencé). */
  stageIndex: number;
  failed: boolean;
  errorMessage?: string | null;
  isRetrying?: boolean;
  /** Réduit le modal en badge flottant (le podcast continue en arrière-plan). */
  onMinimize: () => void;
  onRetry: () => void;
  onClose: () => void;
}

/**
 * Modal de progression du podcast : anneau circulaire avec icône au centre, étape courante
 * annoncée aux lecteurs d'écran, et « Continuer en arrière-plan » (Échap fait de même).
 * La génération n'est jamais annulée implicitement : seul l'état d'échec propose « Fermer ».
 */
export function PodcastProgressModal({
  progress,
  label,
  stageIndex,
  failed,
  errorMessage,
  isRetrying = false,
  onMinimize,
  onRetry,
  onClose,
}: PodcastProgressModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="podcast-modal-title"
        aria-describedby="podcast-modal-status"
        tabIndex={-1}
        onKeyDown={(e) => {
          // Échap : uniquement réduire (jamais d'annulation implicite du job)
          if (e.key === "Escape") (failed ? onClose : onMinimize)();
        }}
        className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl"
      >
        <div className="flex justify-center">
          <CircularProgressRing
            value={progress / 100}
            size={96}
            strokeWidth={6}
            color={failed ? "#ef4444" : "#6366f1"}
            label={`Progression du podcast : ${progress} %`}
          >
            <span
              aria-hidden="true"
              className={`flex ${failed ? "text-red-500" : "text-indigo-600 motion-safe:animate-pulse"}`}
            >
              <GraphicEqIcon sx={{ fontSize: 36 }} />
            </span>
          </CircularProgressRing>
        </div>

        <h2 id="podcast-modal-title" className="mt-5 text-lg font-semibold text-gray-900">
          {failed ? "Le podcast n'a pas pu être généré" : "Génération du podcast"}
        </h2>

        <div id="podcast-modal-status" role="status" aria-live="polite" className="mt-2 space-y-1">
          <p className="text-sm font-medium text-gray-700">
            {failed ? (errorMessage ?? label) : `${label} · ${progress} %`}
          </p>
          {!failed && (
            <p className="text-xs text-gray-500">
              Votre cours est prêt : vous pouvez le lire pendant que l&apos;audio se prépare.
            </p>
          )}
        </div>

        {!failed && (
          <ol className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500" aria-label="Étapes">
            {PODCAST_STAGES.map((stage, i) => {
              const state = i < stageIndex ? "done" : i === stageIndex ? "current" : "todo";
              return (
                <li
                  key={stage}
                  aria-current={state === "current" ? "step" : undefined}
                  className={`rounded-full px-2.5 py-1 ${
                    state === "current"
                      ? "bg-indigo-100 font-medium text-indigo-800"
                      : state === "done"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {state === "done" && <span aria-hidden="true">✓ </span>}
                  {stageLabel({ stage, status: stage })}
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-6 flex justify-center gap-2">
          {failed ? (
            <>
              <Button type="button" variant="secondary" onClick={onClose}>
                Fermer
              </Button>
              <Button type="button" loading={isRetrying} onClick={onRetry}>
                Réessayer
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={onMinimize}>
              Continuer en arrière-plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
