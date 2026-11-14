"use client";

import { LatexText } from "@/shared/utils/latex";
import type { StepSupport } from "../../course.types";
import type { CycleAnswerRecord } from "../../cycleProgress";
import { ChartBlock } from "../blocks/ChartBlock";
import { DiagramBlock } from "../blocks/DiagramBlock";
import { TableBlock } from "../blocks/SimpleBlocks";
import { ClassifyAction } from "./ClassifyAction";
import { FillTableAction } from "./FillTableAction";
import { MatchAction } from "./MatchAction";
import { OrderAction } from "./OrderAction";

/** Supports qui demandent une manipulation (le widget de l'étape les remplace quand il existe). */
export const ACTION_KINDS: ReadonlySet<StepSupport["kind"]> = new Set(["fill_table", "classify", "order", "match"]);

interface StepSupportViewProps {
  support: StepSupport;
  answer?: CycleAnswerRecord;
  onAnswer: (record: CycleAnswerRecord) => void;
}

/** Contenu du support : blocs existants (graphique, schéma, tableau) ou action de reconstruction. */
function SupportContent({ support, answer, onAnswer }: StepSupportViewProps) {
  const caption =
    support.caption && support.kind !== "chart" && support.kind !== "diagram" && support.kind !== "table" ? (
      <p className="mb-2 text-xs text-ink-3">
        <LatexText text={support.caption} />
      </p>
    ) : null;

  switch (support.kind) {
    case "chart":
      return <ChartBlock chart={support.chart} />;
    case "diagram":
      return <DiagramBlock diagram={support.diagram} />;
    case "table":
      return <TableBlock table={support.table} />;
    case "fill_table":
      return (
        <>
          {caption}
          <FillTableAction support={support} answer={answer} onAnswer={onAnswer} />
        </>
      );
    case "classify":
      return (
        <>
          {caption}
          <ClassifyAction support={support} answer={answer} onAnswer={onAnswer} />
        </>
      );
    case "order":
      return (
        <>
          {caption}
          <OrderAction support={support} answer={answer} onAnswer={onAnswer} />
        </>
      );
    case "match":
      return (
        <>
          {caption}
          <MatchAction support={support} answer={answer} onAnswer={onAnswer} />
        </>
      );
  }
}

/** Support d'une mini-étape (graphique, schéma, tableau ou action de reconstruction) posé sur une carte `sunken`. */
export function StepSupportView(props: StepSupportViewProps) {
  return (
    <div className="rounded-card bg-sunken p-2.5 sm:p-3">
      <SupportContent {...props} />
    </div>
  );
}
