"use client";

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Dialogue de confirmation générique pour une action destructrice (suppression…).
 * Monté à la demande ; Échap ou clic sur le voile le ferme.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal onClose={onClose} labelledBy="confirm-dialog-title" size="md">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <WarningAmberIcon fontSize="small" />
        </span>
        <div className="min-w-0">
          <h2 id="confirm-dialog-title" className="text-base font-semibold text-gray-900">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button type="button" variant="danger" loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
