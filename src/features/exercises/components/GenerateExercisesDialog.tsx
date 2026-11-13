"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

interface GenerateExercisesDialogProps {
  loading?: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Fenêtre « Générer les exercices ? » proposée une fois le cours et le quiz prêts.
 * Le focus entre dans la fenêtre à l'ouverture (sur « Non », choix sans effet) et revient
 * à l'élément précédent à la fermeture ; Échap ou clic sur le voile équivalent à « Non ».
 */
export function GenerateExercisesDialog({ loading = false, onAccept, onDecline }: GenerateExercisesDialogProps) {
  const declineRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    declineRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  return (
    <Modal onClose={onDecline} labelledBy="generate-exercises-title" size="md">
      <h2 id="generate-exercises-title" className="text-base font-semibold text-gray-900">
        Générer les exercices ?
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Des exercices corrigés, liés aux sections du cours, peuvent être préparés. La génération prend un moment et
        se fait en arrière-plan.
      </p>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button ref={declineRef} type="button" variant="secondary" onClick={onDecline} disabled={loading}>
          Non
        </Button>
        <Button type="button" loading={loading} onClick={onAccept}>
          Oui, générer
        </Button>
      </div>
    </Modal>
  );
}
