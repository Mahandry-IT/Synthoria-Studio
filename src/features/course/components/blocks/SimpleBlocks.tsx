"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { CodeBlock } from "@/components/code/CodeBlock";
import { LatexText } from "@/shared/utils/latex";
import { RichTable, RichText } from "../RichText";
import type { CourseContentBlock } from "../../course.types";

export function TextBlock({ text }: { text: string }) {
  return <RichText text={text} className="text-sm leading-relaxed text-gray-700" />;
}

/** Tableau pleine largeur, défilement horizontal interne sur mobile (assuré par `RichTable`). */
export function TableBlock({ table }: { table: NonNullable<CourseContentBlock["table"]> }) {
  if (table.headers.length === 0) return null;
  return <RichTable headers={table.headers} rows={table.rows} caption={table.caption} />;
}

export function ListBlock({ items, ordered }: { items: string[]; ordered?: boolean | null }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`my-2 space-y-1 pl-5 text-sm text-gray-700 ${ordered ? "list-decimal" : "list-disc"}`}>
      {items.map((item, i) => (
        <li key={i}>
          <RichText text={item} />
        </li>
      ))}
    </Tag>
  );
}

export function FormulaBlock({ formula }: { formula: NonNullable<CourseContentBlock["formula"]> }) {
  return (
    <div className="my-3 overflow-x-auto rounded-lg bg-gray-50 px-4 py-3 text-center">
      <LatexText text={`$$${formula.latex}$$`} />
      {formula.description && <p className="mt-1 text-xs text-gray-500">{formula.description}</p>}
    </div>
  );
}

export function CodeSnippetBlock({ code, language }: { code: string; language?: string | null }) {
  return <CodeBlock code={code} language={language} />;
}

export function DefinitionCard({ text }: { text: string }) {
  return (
    <div className="my-2 rounded-lg border-l-4 border-indigo-500 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
      <RichText text={text} />
    </div>
  );
}

const CALLOUT_STYLES = {
  note: { box: "border-sky-300 bg-sky-50 text-sky-900", label: "Note" },
  warning: { box: "border-amber-300 bg-amber-50 text-amber-900", label: "Attention" },
  tip: { box: "border-emerald-300 bg-emerald-50 text-emerald-900", label: "Astuce" },
} as const;

export function Callout({ text, variant }: { text: string; variant?: CourseContentBlock["callout_variant"] }) {
  const style = CALLOUT_STYLES[variant ?? "note"];
  return (
    <aside className={`my-2 rounded-lg border px-4 py-3 text-sm ${style.box}`}>
      <p className="mb-1 font-semibold">{style.label}</p>
      <RichText text={text} />
    </aside>
  );
}

export function PitfallCard({ pitfall }: { pitfall: NonNullable<CourseContentBlock["pitfall"]> }) {
  return (
    <Card className="my-2 border-red-200 bg-red-50 p-4 text-sm text-gray-800">
      <p className="font-semibold text-red-800">
        <RichText text={pitfall.description} />
      </p>
      {pitfall.why_it_happens && (
        <p className="mt-2">
          <span className="font-medium">Pourquoi : </span>
          <RichText text={pitfall.why_it_happens} />
        </p>
      )}
      {pitfall.how_to_avoid && (
        <p className="mt-1">
          <span className="font-medium">Comment l&apos;éviter : </span>
          <RichText text={pitfall.how_to_avoid} />
        </p>
      )}
    </Card>
  );
}

/** Exemple résolu : étapes révélées une à une, pour suivre le raisonnement plutôt que le survoler. */
export function WorkedExampleStepper({ example }: { example: NonNullable<CourseContentBlock["worked_example"]> }) {
  const steps = example.steps ?? [];
  const [shown, setShown] = useState(1);
  const done = shown >= steps.length;

  return (
    <Card className="my-3 bg-gray-50 p-4 text-sm">
      <h4 className="mb-2 font-medium text-gray-900">Exemple</h4>
      {example.statement && (
        <p className="mb-3 italic text-gray-600">
          <RichText text={example.statement} />
        </p>
      )}
      <ol className="list-decimal space-y-2 pl-5 text-gray-700">
        {steps.slice(0, shown).map((step, i) => (
          <li key={i}>
            <RichText text={step} />
          </li>
        ))}
      </ol>
      {!done && (
        <div className="mt-3 flex gap-3">
          <button type="button" onClick={() => setShown((n) => n + 1)} className="text-indigo-600 hover:underline">
            Étape suivante
          </button>
          <button type="button" onClick={() => setShown(steps.length)} className="text-gray-500 hover:underline">
            Tout afficher
          </button>
        </div>
      )}
      {done && example.result && (
        <p className="mt-3 font-medium text-green-700">
          <RichText text={example.result} />
        </p>
      )}
    </Card>
  );
}
