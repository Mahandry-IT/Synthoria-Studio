import { toast } from "react-toastify";

import { describeError, errorToastId, type StatusMessages } from "@/shared/api/errors";
import { ErrorToast } from "./ErrorToast";

const ERROR_AUTO_CLOSE_MS = 6_000;
/** Marge laissée après la fin du compte à rebours avant la fermeture automatique. */
const RETRY_GRACE_MS = 5_000;
const MAX_AUTO_CLOSE_MS = 120_000;

export interface ToastErrorOptions {
  /** Affiche un bouton « Réessayer » qui rappelle cette fonction. */
  onRetry?: () => void;
  /** Messages par statut propres au contexte, utilisés si le backend ne donne pas de `detail`. */
  messages?: StatusMessages;
}

/**
 * Toast d'erreur structuré (message, « Réessayer », compte à rebours d'un 429, détails en dev).
 * Une erreur identique (même code, statut et requête) remplace le toast existant au lieu de s'empiler.
 */
export function toastError(err: unknown, { onRetry, messages }: ToastErrorOptions = {}): void {
  const info = describeError(err, messages);
  const toastId = errorToastId(info);
  const retryAt =
    info.retryAfterSeconds !== undefined && info.retryAfterSeconds > 0
      ? Date.now() + info.retryAfterSeconds * 1000
      : undefined;
  const autoClose =
    retryAt !== undefined ? Math.min(retryAt - Date.now() + RETRY_GRACE_MS, MAX_AUTO_CLOSE_MS) : ERROR_AUTO_CLOSE_MS;

  const occurredAt = new Date();
  const render = ({ closeToast }: { closeToast?: () => void }) => (
    <ErrorToast
      info={info}
      occurredAt={occurredAt}
      retryAt={retryAt}
      onRetry={onRetry}
      onPin={() => toast.update(toastId, { autoClose: false })}
      closeToast={closeToast}
    />
  );
  // Contenu interactif : un clic dans le toast ne doit pas le fermer.
  const options = { toastId, autoClose, closeOnClick: false, role: "alert" } as const;

  if (toast.isActive(toastId)) toast.update(toastId, { ...options, render });
  else toast.error(render, options);
}

/** Toast succès — fermeture auto après 4 s */
export function toastSuccess(message: string): void {
  toast.success(message, { autoClose: 4_000 });
}

/** Toast warning — fermeture auto après 5 s */
export function toastWarning(message: string): void {
  toast.warning(message, { autoClose: 5_000 });
}
