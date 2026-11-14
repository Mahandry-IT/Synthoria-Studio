"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/Button";
import type { ActionResult } from "../../cycleActions";
import type { CycleAnswerRecord } from "../../cycleProgress";
import { LiveNote, TOUCH_TARGET } from "./cycleUi";

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
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      {instruction && <p className="mb-3 text-sm text-gray-700">{instruction}</p>}
      {children({ wrong, locked })}
      {!locked && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" className={TOUCH_TARGET} onClick={verify}>
            Vérifier
          </Button>
          <Button type="button" variant="ghost" className={TOUCH_TARGET} onClick={reveal}>
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
    <span className="shrink-0 text-xs font-medium text-red-700">
      <span aria-hidden="true">⚠</span>
      <span className="sr-only"> à revoir</span>
    </span>
  ) : null;
}

/** Classe de bordure d'un élément à reprendre. */
export const wrongBorder = (isWrong: boolean): string => (isWrong ? "border-red-400 bg-red-50" : "border-gray-200 bg-white");
