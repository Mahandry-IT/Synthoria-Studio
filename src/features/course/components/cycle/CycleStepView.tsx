"use client";

import { RichText } from "../RichText";
import { WidgetBlock } from "../blocks/WidgetBlock";
import type { CycleStep } from "../../course.types";
import { answerKey, type CycleAnswerRecord } from "../../cycleProgress";
import { StepPrediction } from "./StepPrediction";
import { ACTION_KINDS, StepSupportView } from "./StepSupportView";

interface CycleStepViewProps {
  step: CycleStep;
  /** Position 0-based et nombre total de mini-étapes. */
  index: number;
  total: number;
  /** Id DOM du titre de l'étape (cible du focus). */
  headingId: string;
  getAnswer: (id: string) => CycleAnswerRecord | undefined;
  onAnswer: (id: string, record: CycleAnswerRecord) => void;
}

/**
 * Une mini-étape de « Sous le capot » : texte court, consigne, prédiction éventuelle puis support.
 * Le support n'apparaît qu'une fois la prédiction faite ou passée (« je ne sais pas »), pour qu'elle
 * précède la manipulation. Le widget de l'étape remplace l'action de reconstruction quand il existe.
 */
export function CycleStepView({ step, index, total, headingId, getAnswer, onAnswer }: CycleStepViewProps) {
  const predictionId = answerKey.prediction(index);
  const actionId = answerKey.action(index);
  const predicted = !step.prediction || Boolean(getAnswer(predictionId));
  const { support, widget } = step;
  const widgetReplacesAction = Boolean(widget && support && ACTION_KINDS.has(support.kind));

  return (
    <div className="space-y-3">
      <h5 id={headingId} tabIndex={-1} className="kicker focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        Étape {index + 1} sur {total}
      </h5>
      <RichText text={step.text} className="text-[15px] leading-relaxed text-ink" />
      {step.action && (
        <p className="rounded-ctrl border-l-[3px] border-accent bg-primary-soft px-3.5 py-2.5 text-sm text-ink">
          <span className="font-semibold">À toi : </span>
          <RichText text={step.action} />
        </p>
      )}
      {step.prediction && (
        <StepPrediction
          prediction={step.prediction}
          answer={getAnswer(predictionId)}
          onAnswer={(record) => onAnswer(predictionId, record)}
        />
      )}
      {predicted && widget && <WidgetBlock widget={widget} />}
      {predicted && support && !widgetReplacesAction && (
        <StepSupportView support={support} answer={getAnswer(actionId)} onAnswer={(record) => onAnswer(actionId, record)} />
      )}
    </div>
  );
}
