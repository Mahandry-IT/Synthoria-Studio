"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/Button";
import type { ActionResult } from "../../cycleActions";
import type { CycleAnswerRecord } from "../../cycleProgress";
import { LiveNote } from "./cycleUi";

export interface ActionView {
  /** Éléments à reprendre après une vérification ratée (indices propres à chaque action). */
  wrong: number[];
  /** Action terminée (réussie ou solution affichée) : les champs ne se modifient plus. */
  locked: boolean;
}

interface ActionFrameProps {
  instruction?: string;
  /** Réponse déjà donnée (reprise) : l'action s'affiche verrouillée sur sa solution. */
  answer?: CycleAnswerRecord;
  onAnswer: (record: CycleAnswerRecord) => void;
  check: () => ActionResult;
  /** Place l'action dans son état « solution » (le parent détient l'état de l'action). */
  showSolution: () => void;
  children: (view: ActionView) => ReactNode;
}

/**
 * Cadre commun des actions de reconstruction : « Vérifier » (retour sans note, éléments à revoir signalés)
 * et « Voir la solution » : jamais de blocage, l'apprenant peut toujours avancer.
 */
export function ActionFrame({ instruction, answer, onAnswer, check, showSolution, children }: ActionFrameProps) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [tried, setTried] = useState(false);
  const locked = Boolean(answer);

  const verify = () => {
    const result = check();
    setTried(true);
    setWrong(result.wrong);
    if (result.correct) onAnswer({ correct: true });
  };
  const reveal = () => {
    setWrong([]);
    showSolution();
    onAnswer({ correct: false, skipped: true });
  };

  let note: ReactNode = null;
  if (locked) note = answer?.correct ? "Bien joué : tout est à sa place." : "Voici la solution.";
  else if (tried && wrong.length > 0) {
    note = `Pas encore : ${wrong.length} élément${wrong.length > 1 ? "s" : ""} à revoir (signalé${wrong.length > 1 ? "s" : ""} par ⚠).`;
  }

  return (
    <div className="rounded-card border border-line bg-surface p-3 sm:p-4">
      {instruction && <p className="mb-3 text-sm text-ink-2">{instruction}</p>}
      {children({ wrong, locked })}
      {!locked && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" onClick={verify}>
            Vérifier
          </Button>
          <Button type="button" variant="ghost" onClick={reveal}>
            Voir la solution
          </Button>
        </div>
      )}
      <LiveNote tone={locked && answer?.correct ? "success" : tried && !locked ? "warn" : "info"}>{note}</LiveNote>
    </div>
  );
}

/** Pastille « à revoir » (symbole + texte, pas seulement la couleur). */
export function WrongFlag({ show }: { show: boolean }) {
  return show ? (
    <span className="shrink-0 text-xs font-semibold text-err">
      <span aria-hidden="true">⚠</span>
      <span className="sr-only"> à revoir</span>
    </span>
  ) : null;
}

/** Classe de bordure d'un élément à reprendre. */
export const wrongBorder = (isWrong: boolean): string => (isWrong ? "border-err bg-err-soft" : "border-line bg-bg");
