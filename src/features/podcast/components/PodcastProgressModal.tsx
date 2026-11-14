"use client";

import { useRef } from "react";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { Button } from "@/components/Button";
import { CircularProgressRing } from "@/components/CircularProgressRing";
import { Modal } from "@/components/Modal";
import { Stepper } from "@/components/Stepper";
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
  const contentRef = useRef<HTMLDivElement>(null);
  useFocusTrap(contentRef);

  return (
    // Échap : uniquement réduire, jamais d'annulation implicite du job
    <Modal
      onClose={failed ? onClose : onMinimize}
      labelledBy="podcast-modal-title"
      describedBy="podcast-modal-status"
      role="alertdialog"
      closeOnOverlay={false}
    >
      <div ref={contentRef} tabIndex={-1} className="text-center outline-none">
        <div className="flex justify-center">
          <CircularProgressRing
            value={progress / 100}
            size={96}
            strokeWidth={6}
            color={failed ? "var(--err)" : "var(--accent)"}
            label={`Progression du podcast : ${progress} %`}
          >
            <span
              aria-hidden="true"
              className={`flex ${failed ? "text-err" : "text-accent motion-safe:animate-pulse"}`}
            >
              <GraphicEqIcon sx={{ fontSize: 36 }} />
            </span>
          </CircularProgressRing>
        </div>

        <h2 id="podcast-modal-title" className="mt-5 font-serif text-lg font-semibold text-ink">
          {failed ? "Le podcast n'a pas pu être généré" : "Génération du podcast"}
        </h2>

        <div id="podcast-modal-status" role="status" aria-live="polite" className="mt-2 space-y-1">
          <p className="text-sm font-medium text-ink-2">
            {failed ? (errorMessage ?? label) : `${label} · ${progress} %`}
          </p>
          {!failed && (
            <p className="text-xs text-ink-3">
              Votre cours est prêt : vous pouvez le lire pendant que l&apos;audio se prépare.
            </p>
          )}
        </div>

        {!failed && (
          <div className="mt-4">
            {stageIndex >= 0 && <Stepper label="Étapes" total={PODCAST_STAGES.length} current={stageIndex + 1} />}
            {/* Noms des étapes : redondants avec le texte masqué du Stepper, donc cachés aux lecteurs d'écran */}
            <ol aria-hidden="true" className="mt-1.5 flex gap-1.5 font-mono text-[11px] text-ink-3">
              {PODCAST_STAGES.map((stage, i) => (
                <li key={stage} className={`flex-1 ${i === stageIndex ? "font-semibold text-ink" : ""}`}>
                  {i < stageIndex && "✓ "}
                  {stageLabel({ stage, status: stage })}
                </li>
              ))}
            </ol>
          </div>
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
            <Button type="button" variant="secondary" onClick={onMinimize}>
              Continuer en arrière-plan
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
