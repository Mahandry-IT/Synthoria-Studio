"use client";

import { useId, useState } from "react";
import { Button } from "@/components/Button";
import { CONTROL_CLASSES } from "@/components/Input";
import { LatexText } from "@/shared/utils/latex";
import { RichText } from "../RichText";
import type { StepPrediction as StepPredictionData } from "../../course.types";
import {
  checkPrediction,
  parseValueInput,
  pickedOf,
  predictionToRecord,
  recordToPrediction,
  valueTextOf,
  type PredictionAnswer,
  type PredictionVerdict,
} from "../../cycleAnswers";
import type { CycleAnswerRecord } from "../../cycleProgress";
import { ChoiceList, LiveNote } from "./cycleUi";

interface StepPredictionProps {
  prediction: StepPredictionData;
  answer?: CycleAnswerRecord;
  onAnswer: (record: CycleAnswerRecord) => void;
}

const VERDICT_LINE: Record<PredictionVerdict, string> = {
  correct: "Ta prédiction était juste.",
  incorrect: "Pas tout à fait, et c'est normal : regarde ce qui se passe vraiment.",
  skipped: "Pas de souci : voyons ce qui se passe.",
};

/** Saisie d'une valeur avec unité ; la virgule française est acceptée. */
function ValueField({ prediction, value, onChange, disabled, invalid }: {
  prediction: StepPredictionData;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  invalid: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        Ta valeur
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`${CONTROL_CLASSES} w-40`}
        />
        {prediction.unit && <span className="text-sm text-ink-2">{prediction.unit}</span>}
      </div>
      {invalid && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-err">
          Saisis un nombre (virgule ou point).
        </p>
      )}
    </div>
  );
}

/**
 * Prédiction posée avant la manipulation : un choix ou une valeur (tolérance et unité), « je ne sais pas »
 * toujours possible. Le retour compare la prédiction à `outcome` ; jamais de note.
 */
export function StepPrediction({ prediction, answer, onAnswer }: StepPredictionProps) {
  const [picked, setPicked] = useState<number[]>([]);
  const [draftText, setText] = useState("");
  const text = valueTextOf(answer, draftText);
  const parsed = parseValueInput(text);
  const given: PredictionAnswer | null = answer ? recordToPrediction(answer) : null;
  const verdict = given ? checkPrediction(prediction, given) : null;

  const submit = () => {
    const next: PredictionAnswer =
      prediction.kind === "choice" ? { kind: "choice", index: picked[0] } : { kind: "value", value: parsed };
    onAnswer(predictionToRecord(next));
  };
  const canSubmit = prediction.kind === "choice" ? picked.length === 1 : parsed !== null;
  const unreadable = prediction.kind === "value" && !answer && text.trim() !== "" && parsed === null;

  return (
    <div className="rounded-card border border-line bg-primary-soft p-3 sm:p-4">
      <p className="mb-3 text-[15px] font-medium leading-snug text-ink">
        <span className="kicker mr-2 text-primary">Prédis</span>
        <LatexText text={prediction.question} />
      </p>
      {prediction.kind === "choice" ? (
        <ChoiceList
          legend={<span className="sr-only">Ta prédiction</span>}
          options={prediction.options}
          selected={pickedOf(answer, picked)}
          onChange={setPicked}
          multiple={false}
          disabled={Boolean(answer)}
        />
      ) : (
        <ValueField prediction={prediction} value={text} onChange={setText} disabled={Boolean(answer)} invalid={unreadable} />
      )}
      {!answer && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" disabled={!canSubmit} onClick={submit}>
            Valider ma prédiction
          </Button>
          <Button type="button" variant="ghost" onClick={() => onAnswer(predictionToRecord({ kind: "skip" }))}>
            Je ne sais pas
          </Button>
        </div>
      )}
      <LiveNote tone={verdict === "correct" ? "success" : "info"}>
        {verdict ? (
          <>
            <span>{VERDICT_LINE[verdict]}</span>{" "}
            <span className="font-medium">Résultat : </span>
            <RichText text={prediction.outcome} />
          </>
        ) : null}
      </LiveNote>
    </div>
  );
}
