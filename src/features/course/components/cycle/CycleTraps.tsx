"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { LatexText } from "@/shared/utils/latex";
import type { CycleTraps as CycleTrapsData, TrapEntry } from "../../course.types";
import { isRewriteCorrect, isSpotCorrect, pickedOf } from "../../cycleAnswers";
import { answerKey, type CycleAnswerRecord } from "../../cycleProgress";
import { RichText } from "../RichText";
import { ChoiceList, LiveNote } from "./cycleUi";

interface TrapProps {
  entry: TrapEntry;
  index: number;
  getAnswer: (id: string) => CycleAnswerRecord | undefined;
  onAnswer: (id: string, record: CycleAnswerRecord) => void;
}

/** La correction explique pourquoi l'erreur est tentante (champ `explanation` du cours). */
function Explanation({ text }: { text: string }) {
  return (
    <>
      <span className="font-semibold">Pourquoi c&apos;est tentant : </span>
      <RichText text={text} />
    </>
  );
}

/** Mode `cards` : une affirmation fausse, l'explication se révèle au clic (jamais au survol). */
function TrapCard({ entry, index, getAnswer, onAnswer }: TrapProps) {
  const panelId = useId();
  const open = Boolean(getAnswer(answerKey.trapCard(index)));
  return (
    <div className="rounded-card border border-line bg-surface p-3.5 sm:p-4">
      <p className="text-[15px] font-medium leading-snug text-ink">
        <Badge variant="warn" className="mr-2 align-middle">Erreur courante</Badge>
        <LatexText text={entry.claim} />
      </p>
      <Button
        type="button"
        variant="secondary"
        className="mt-3"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onAnswer(answerKey.trapCard(index), { picked: [] })}
        disabled={open}
      >
        {open ? "Explication affichée" : "Voir pourquoi c'est faux"}
      </Button>
      <div id={panelId} aria-live="polite">
        {open && (
          <div className="mt-3 rounded-ctrl border-l-[3px] border-accent bg-primary-soft px-3.5 py-2.5 text-sm text-ink">
            <Explanation text={entry.explanation} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Modes `spot` et `spot_rewrite` : repérer l'affirmation fausse, puis (spot_rewrite) choisir la bonne reformulation. */
function TrapSpot({ entry, index, rewrite, getAnswer, onAnswer }: TrapProps & { rewrite: boolean }) {
  const spotAnswer = getAnswer(answerKey.trapSpot(index));
  const rewriteAnswer = getAnswer(answerKey.trapRewrite(index));
  const [spotPick, setSpotPick] = useState<number[]>([]);
  const [rewritePick, setRewritePick] = useState<number[]>([]);

  const spotDone = Boolean(spotAnswer);
  const spotRight = spotDone && spotAnswer?.picked?.[0] !== undefined && isSpotCorrect(entry, spotAnswer.picked[0]);
  const rewriteDone = Boolean(rewriteAnswer);
  const finished = rewrite ? rewriteDone : spotDone;

  // Après validation : l'affirmation fausse est signalée, et le choix manqué s'il était différent.
  const spotMarks: Record<number, "correct" | "wrong"> = {};
  if (spotDone && entry.wrong_index !== null) {
    spotMarks[entry.wrong_index] = "correct";
    const chosen = spotAnswer?.picked?.[0];
    if (chosen !== undefined && !spotRight) spotMarks[chosen] = "wrong";
  }

  return (
    <div className="space-y-3 rounded-card border border-line bg-surface p-3.5 sm:p-4">
      <ChoiceList
        legend="Laquelle de ces affirmations est fausse ?"
        options={entry.statements}
        selected={pickedOf(spotAnswer, spotPick)}
        onChange={setSpotPick}
        multiple={false}
        disabled={spotDone}
        marks={spotMarks}
      />
      {!spotDone && (
        <Button
          type="button"
          disabled={spotPick.length !== 1}
          onClick={() => onAnswer(answerKey.trapSpot(index), { picked: spotPick, correct: isSpotCorrect(entry, spotPick[0]) })}
        >
          Valider
        </Button>
      )}
      <LiveNote tone={spotDone ? (spotRight ? "success" : "warn") : "info"}>
        {spotDone ? (spotRight ? "Bien repéré." : "Ce n'est pas celle-ci : la fausse est signalée ci-dessus.") : null}
      </LiveNote>

      {rewrite && spotDone && (
        <div className="space-y-3">
          <ChoiceList
            legend="Quelle est la bonne reformulation ?"
            options={entry.rewrite_options}
            selected={pickedOf(rewriteAnswer, rewritePick)}
            onChange={setRewritePick}
            multiple={false}
            disabled={rewriteDone}
            marks={
              rewriteDone && entry.correct_rewrite_index !== null
                ? { [entry.correct_rewrite_index]: "correct" }
                : undefined
            }
          />
          {!rewriteDone && (
            <Button
              type="button"
              disabled={rewritePick.length !== 1}
              onClick={() =>
                onAnswer(answerKey.trapRewrite(index), { picked: rewritePick, correct: isRewriteCorrect(entry, rewritePick[0]) })
              }
            >
              Valider la reformulation
            </Button>
          )}
        </div>
      )}
      <div aria-live="polite">
        {finished && (
          <div className="rounded-ctrl bg-warn-soft px-3.5 py-2.5 text-sm text-ink">
            <Explanation text={entry.explanation} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * « Les pièges classiques » : `cards` (cartes à révéler), `spot` (repérer l'affirmation fausse) ou
 * `spot_rewrite` (repérer puis choisir la bonne reformulation). Aucun score ; la correction explique
 * pourquoi l'erreur est tentante.
 */
export function CycleTraps({ traps, getAnswer, onAnswer }: Omit<TrapProps, "entry" | "index"> & { traps: CycleTrapsData }) {
  return (
    <ul className="space-y-3">
      {traps.entries.map((entry, i) => (
        <li key={i}>
          {traps.mode === "cards" ? (
            <TrapCard entry={entry} index={i} getAnswer={getAnswer} onAnswer={onAnswer} />
          ) : (
            <TrapSpot entry={entry} index={i} rewrite={traps.mode === "spot_rewrite"} getAnswer={getAnswer} onAnswer={onAnswer} />
          )}
        </li>
      ))}
    </ul>
  );
}
