"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { CodeBlock } from "@/components/code/CodeBlock";
import { LatexText } from "@/shared/utils/latex";
import { stripMathDelimiters } from "@/shared/utils/mathNotation";
import { RichTable, RichText } from "../RichText";
import type { CourseContentBlock } from "../../course.types";

export function TextBlock({ text }: { text: string }) {
  return <RichText text={text} className="text-sm leading-relaxed text-ink" />;
}

/** Tableau pleine largeur, défilement horizontal interne sur mobile (assuré par `RichTable`). */
export function TableBlock({ table }: { table: NonNullable<CourseContentBlock["table"]> }) {
  if (table.headers.length === 0) return null;
  return <RichTable headers={table.headers} rows={table.rows} caption={table.caption} />;
}

export function ListBlock({ items, ordered }: { items: string[]; ordered?: boolean | null }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`my-2 space-y-1 pl-5 text-sm text-ink marker:text-ink-3 ${ordered ? "list-decimal" : "list-disc"}`}>
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
    <div className="my-3 overflow-x-auto rounded-card bg-sunken px-4 py-3 text-center">
      <LatexText text={`$$${stripMathDelimiters(formula.latex)}$$`} />
      {formula.description && <p className="mt-1 text-xs text-ink-3">{formula.description}</p>}
    </div>
  );
}

export function CodeSnippetBlock({ code, language }: { code: string; language?: string | null }) {
  return <CodeBlock code={code} language={language} />;
}

export function DefinitionCard({ text }: { text: string }) {
  return (
    <div className="my-2 rounded-card border-l-4 border-primary bg-primary-soft px-4 py-3 text-sm text-ink">
      <RichText text={text} />
    </div>
  );
}

/** Texte courant en `ink` sur le fond doux ; le sens passe par le libellé, la couleur le renforce. */
const CALLOUT_STYLES = {
  note: { box: "border-primary bg-primary-soft", title: "text-primary", label: "Note" },
  warning: { box: "border-warn bg-warn-soft", title: "text-warn", label: "Attention" },
  tip: { box: "border-ok bg-ok-soft", title: "text-ok", label: "Astuce" },
} as const;

export function Callout({ text, variant }: { text: string; variant?: CourseContentBlock["callout_variant"] }) {
  const style = CALLOUT_STYLES[variant ?? "note"];
  return (
    <aside className={`my-2 rounded-card border px-4 py-3 text-sm text-ink ${style.box}`}>
      <p className={`mb-1 font-semibold ${style.title}`}>{style.label}</p>
      <RichText text={text} />
    </aside>
  );
}

export function PitfallCard({ pitfall }: { pitfall: NonNullable<CourseContentBlock["pitfall"]> }) {
  return (
    <div className="my-2 rounded-card border border-err bg-err-soft p-4 text-sm text-ink">
      <p className="font-semibold text-err">
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
    </div>
  );
}

/** Exemple résolu : étapes révélées une à une, pour suivre le raisonnement plutôt que le survoler. */
export function WorkedExampleStepper({ example }: { example: NonNullable<CourseContentBlock["worked_example"]> }) {
  const steps = example.steps ?? [];
  const [shown, setShown] = useState(1);
  const done = shown >= steps.length;

  return (
    <div className="my-3 rounded-card border border-line bg-sunken p-4 text-sm text-ink">
      <h4 className="mb-2 font-serif text-base font-medium text-ink">Exemple</h4>
      {example.statement && (
        <p className="mb-3 italic text-ink-2">
          <RichText text={example.statement} />
        </p>
      )}
      <ol className="list-decimal space-y-2 pl-5 text-ink marker:text-ink-3">
        {steps.slice(0, shown).map((step, i) => (
          <li key={i}>
            <RichText text={step} />
          </li>
        ))}
      </ol>
      {!done && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setShown((n) => n + 1)}>
            Étape suivante
          </Button>
          <Button type="button" variant="ghost" onClick={() => setShown(steps.length)}>
            Tout afficher
          </Button>
        </div>
      )}
      {done && example.result && (
        <p className="mt-3 font-medium text-ok">
          <RichText text={example.result} />
        </p>
      )}
    </div>
  );
}
