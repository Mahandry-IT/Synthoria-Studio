"use client";

import { useId, useState } from "react";
import { Button } from "@/components/Button";
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
import { ChoiceList, LiveNote, TOUCH_TARGET } from "./cycleUi";

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
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
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
          className={`${TOUCH_TARGET} w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />
        {prediction.unit && <span className="text-sm text-gray-600">{prediction.unit}</span>}
      </div>
      {invalid && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-700">
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
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
      <p className="mb-2 text-sm font-medium text-gray-900">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">Prédis</span>
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
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" className={TOUCH_TARGET} disabled={!canSubmit} onClick={submit}>
            Valider ma prédiction
          </Button>
          <Button type="button" variant="ghost" className={TOUCH_TARGET} onClick={() => onAnswer(predictionToRecord({ kind: "skip" }))}>
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
