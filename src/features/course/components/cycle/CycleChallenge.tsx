"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { LatexText } from "@/shared/utils/latex";
import type { CycleChallenge as CycleChallengeData } from "../../course.types";
import { isChallengeCorrect, pickedOf } from "../../cycleAnswers";
import type { CycleAnswerRecord } from "../../cycleProgress";
import { ChoiceList, LiveNote, TOUCH_TARGET } from "./cycleUi";

interface CycleChallengeProps {
  challenge: CycleChallengeData;
  /** Réponse déjà donnée (reprise après rafraîchissement) ; absente tant que le défi n'est pas validé. */
  answer?: CycleAnswerRecord;
  onAnswer: (record: CycleAnswerRecord) => void;
}

/** Retour en une ligne : le contenu du cours si présent, sinon une phrase neutre. Jamais de compte des bonnes réponses. */
function feedbackLine(challenge: CycleChallengeData, correct: boolean | null): string {
  const base = challenge.feedback.trim();
  if (correct === null) return base || "Pas de souci : la suite explique le mécanisme.";
  if (base) return base;
  return correct ? "Bonne intuition, la suite le confirme." : "Pas tout à fait : la suite explique le mécanisme.";
}

/**
 * Défi posé avant toute explication : cases à cocher, validation explicite, correction en une ligne.
 * Aucune note, et le nombre de bonnes réponses n'est jamais annoncé. « Je ne sais pas » passe le défi.
 */
export function CycleChallenge({ challenge, answer, onAnswer }: CycleChallengeProps) {
  const [picked, setPicked] = useState<number[]>([]);
  const validated = Boolean(answer);
  const correct = validated && !answer?.skipped ? isChallengeCorrect(challenge, pickedOf(answer, picked)) : null;

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-900">
        <LatexText text={challenge.question} />
      </p>
      <ChoiceList
        legend={<span className="text-xs font-normal text-gray-500">Coche ce qui te semble juste, sans te préoccuper du nombre.</span>}
        options={challenge.options}
        selected={pickedOf(answer, picked)}
        onChange={setPicked}
        multiple
        disabled={validated}
      />
      {!validated && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            className={TOUCH_TARGET}
            disabled={picked.length === 0}
            onClick={() => onAnswer({ picked, correct: isChallengeCorrect(challenge, picked) })}
          >
            Valider ma réponse
          </Button>
          <Button type="button" variant="ghost" className={TOUCH_TARGET} onClick={() => onAnswer({ skipped: true })}>
            Je ne sais pas
          </Button>
        </div>
      )}
      <LiveNote tone={correct ? "success" : "info"}>
        {validated ? <LatexText text={feedbackLine(challenge, correct)} /> : null}
      </LiveNote>
    </div>
  );
}
