"use client";

import { useEffect, type ReactNode } from "react";

type ModalSize = "md" | "lg";

interface ModalProps {
  onClose: () => void;
  /** id de l'élément (titre) qui décrit le modal, pour `aria-labelledby`. */
  labelledBy: string;
  /** id de l'élément qui décrit le contenu (`aria-describedby`), facultatif. */
  describedBy?: string;
  /** `alertdialog` pour un message qui exige l'attention (défaut : `dialog`). */
  role?: "dialog" | "alertdialog";
  /** Fermeture au clic sur le voile (défaut : oui). */
  closeOnOverlay?: boolean;
  /** `md` : taille compacte (confirmation). `lg` : formulaire de texte (note). */
  size?: ModalSize;
  children: ReactNode;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  md: "max-w-md p-6",
  lg: "max-w-2xl p-8",
};

/**
 * Overlay + cadre génériques d'un modal (voile, fermeture Échap/clic sur le voile, `role="dialog"`).
 * Le contenu (formulaire, boutons…) est laissé au composant appelant.
 */
export function Modal({ onClose, labelledBy, describedBy, role = "dialog", closeOnOverlay = true, size = "md", children }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-veil p-4 backdrop-blur-sm"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onClick={(e) => e.stopPropagation()}
        className={`w-full rounded-card bg-surface text-ink shadow-lift ${SIZE_CLASSES[size]}`}
      >
        {children}
      </div>
    </div>
  );
}
