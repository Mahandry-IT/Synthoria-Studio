"use client";

import { useId, useState } from "react";
import { formatErrorDetails, shortRequestId, type ErrorInfo } from "@/shared/api/errors";
import { useNow } from "@/shared/hooks/useNow";
import { copyToClipboard } from "@/shared/utils/clipboard";

/** Les détails techniques ne sont jamais rendus dans le bundle de production. */
const SHOW_ERROR_DETAILS = process.env.NODE_ENV !== "production";
const COUNTDOWN_TICK_MS = 1_000;
const COPIED_FEEDBACK_MS = 2_000;

const ACTION_CLASS =
  "rounded-md bg-white/20 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-white/30 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60";

interface ErrorToastProps {
  info: ErrorInfo;
  occurredAt: Date;
  /** Fin d'attente imposée par `Retry-After` (timestamp ms), pour le compte à rebours. */
  retryAt?: number;
  onRetry?: () => void;
  /** Appelé à l'ouverture des détails : le toast ne doit plus se fermer seul. */
  onPin?: () => void;
  closeToast?: () => void;
}

/**
 * Contenu d'un toast d'erreur : message, compte à rebours `Retry-After`, bouton « Réessayer »,
 * détails techniques en développement (repliables, copiables) ou code court en production.
 * Aucun focus automatique : le toast ne vole pas le focus (le rôle `alert` est porté par le conteneur).
 */
export function ErrorToast({ info, occurredAt, retryAt, onRetry, onPin, closeToast }: ErrorToastProps) {
  return (
    <div className="text-sm">
      <p className="font-medium">{info.message}</p>
      {retryAt !== undefined && <RetryCountdown retryAt={retryAt} onRetry={onRetry} closeToast={closeToast} />}
      {retryAt === undefined && onRetry && (
        <div className="mt-2">
          <RetryButton onRetry={onRetry} closeToast={closeToast} />
        </div>
      )}
      {SHOW_ERROR_DETAILS ? (
        <ErrorDetails info={info} occurredAt={occurredAt} onPin={onPin} />
      ) : (
        info.requestId && <p className="mt-1 text-xs opacity-80">Code : {shortRequestId(info.requestId)}</p>
      )}
    </div>
  );
}

function RetryButton({ onRetry, closeToast, disabled }: { onRetry: () => void; closeToast?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={ACTION_CLASS}
      disabled={disabled}
      onClick={() => {
        closeToast?.();
        onRetry();
      }}
    >
      Réessayer
    </button>
  );
}

function RetryCountdown({ retryAt, onRetry, closeToast }: { retryAt: number; onRetry?: () => void; closeToast?: () => void }) {
  const now = useNow(COUNTDOWN_TICK_MS);
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-xs">{remaining > 0 ? `Réessayez dans ${remaining} s` : "Vous pouvez réessayer."}</span>
      {onRetry && <RetryButton onRetry={onRetry} closeToast={closeToast} disabled={remaining > 0} />}
    </div>
  );
}

function ErrorDetails({ info, occurredAt, onPin }: { info: ErrorInfo; occurredAt: Date; onPin?: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelId = useId();

  const toggle = () => {
    if (!open) onPin?.();
    setOpen(!open);
  };

  const copy = async () => {
    const ok = await copyToClipboard(formatErrorDetails(info, occurredAt));
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  };

  return (
    <div className="mt-2">
      <button type="button" className={ACTION_CLASS} aria-expanded={open} aria-controls={panelId} onClick={toggle}>
        {open ? "Masquer les détails" : "Voir détails"}
      </button>
      {open && (
        <div id={panelId} className="mt-2 rounded-md bg-black/20 p-2 text-xs">
          <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 break-all">
            <DetailRow label="Statut" value={info.status?.toString()} />
            <DetailRow label="Requête" value={[info.method, info.url].filter(Boolean).join(" ")} />
            <DetailRow label="error_code" value={info.errorCode} />
            <DetailRow label="request_id" value={info.requestId} />
            <DetailRow label="Date" value={occurredAt.toLocaleString("fr-FR")} />
          </dl>
          {info.debug !== undefined && (
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-black/20 p-1.5">
              {JSON.stringify(info.debug, null, 2)}
            </pre>
          )}
          <button type="button" className={`${ACTION_CLASS} mt-2`} onClick={copy}>
            {copied ? "Copié" : "Copier les détails"}
          </button>
          <span role="status" className="sr-only">
            {copied ? "Détails copiés dans le presse-papiers" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <>
      <dt className="font-semibold">{label}</dt>
      <dd>{value || "—"}</dd>
    </>
  );
}
