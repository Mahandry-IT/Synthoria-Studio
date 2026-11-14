"use client";

import { Button } from "@/components/Button";

interface QuizAbortedProps {
  reason: string | null;
  /** Nouvelle tentative (nouvelle série). */
  onRestart: () => void;
  /** Retour au cours (intro du quiz). */
  onBack: () => void;
}

/**
 * Écran d'arrêt du quiz (anti-triche : sortie du plein écran, changement d'onglet, perte de focus).
 * Distinct de QuizResults : noter un score sur une tentative interrompue laisserait croire à de
 * mauvaises réponses, alors qu'il s'agit de questions jamais atteintes. La tentative est enregistrée
 * comme interrompue, sans note ; « Recommencer » tire une nouvelle série.
 */
export function QuizAborted({ reason, onRestart, onBack }: QuizAbortedProps) {
  return (
    <section
      className="rounded-card border border-err bg-err-soft p-6 text-center text-ink"
      aria-labelledby="quiz-aborted-heading"
    >
      <h3 id="quiz-aborted-heading" className="mb-2 font-serif text-xl font-medium">
        Quiz interrompu
      </h3>
      <p className="mb-1 text-sm">{reason ?? "Vous avez quitté la fenêtre du quiz."}</p>
      <p className="mb-4 text-sm text-ink-2">
        Pour garantir l&apos;intégrité du résultat, le quiz s&apos;arrête dès que vous quittez le plein écran, changez
        d&apos;onglet ou perdez le focus.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>
          Retour au cours
        </Button>
        <Button type="button" onClick={onRestart}>
          Recommencer
        </Button>
      </div>
    </section>
  );
}
