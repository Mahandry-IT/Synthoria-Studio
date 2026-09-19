interface LoadingModalProps {
  /** Affiche ou masque le modal. */
  open: boolean;
  title: string;
  message: string;
  /** Icône centrale (entourée d'un anneau animé). */
  icon: React.ReactNode;
}

/**
 * Modal bloquant d'attente : voile sur toute la page, icône animée, titre et message.
 * Non fermable — il disparaît quand `open` repasse à false.
 */
export function LoadingModal({ open, title, message, icon }: LoadingModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="loading-modal-title"
        aria-describedby="loading-modal-message"
        className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl"
      >
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <span
            className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"
            aria-hidden="true"
          />
          <span className="flex animate-pulse text-indigo-600" aria-hidden="true">
            {icon}
          </span>
        </div>

        <h2 id="loading-modal-title" className="mt-6 text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p
          id="loading-modal-message"
          role="status"
          aria-live="polite"
          className="mt-2 text-sm text-gray-500"
        >
          {message}
        </p>
      </div>
    </div>
  );
}
