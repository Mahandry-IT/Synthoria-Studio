"use client";

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
    <section className="rounded-lg border border-red-200 bg-red-50 p-6 text-center" aria-labelledby="quiz-aborted-heading">
      <h3 id="quiz-aborted-heading" className="text-lg font-semibold text-gray-900 mb-2">
        Quiz interrompu
      </h3>
      <p className="text-sm text-gray-700 mb-1">{reason ?? "Vous avez quitté la fenêtre du quiz."}</p>
      <p className="text-sm text-gray-500 mb-4">
        Pour garantir l&apos;intégrité du résultat, le quiz s&apos;arrête dès que vous quittez le plein écran, changez
        d&apos;onglet ou perdez le focus.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Retour au cours
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Recommencer
        </button>
      </div>
    </section>
  );
}
