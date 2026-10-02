"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { FadedExample as FadedExampleData } from "../../course.types";
import { RichText } from "../RichText";

interface FadedExampleProps {
  example: FadedExampleData;
  /** Nombre d'étapes cachées déjà révélées (persisté avec la progression de la section). */
  revealed: number;
  onReveal: () => void;
  /** Le titre « À toi » est déjà porté par l'étape du lecteur progressif. */
  hideTitle?: boolean;
}

/** « À toi » : les premières étapes sont données, les suivantes se révèlent une à une après essai. */
export function FadedExample({ example, revealed, onReveal, hideTitle = false }: FadedExampleProps) {
  const given = example.given_steps ?? [];
  const hidden = example.hidden_steps ?? [];
  const shown = Math.min(Math.max(revealed, 0), hidden.length);
  const remaining = hidden.length - shown;

  if (given.length === 0 && hidden.length === 0) return null;

  return (
    <Card className="bg-amber-50 p-4 text-sm">
      {!hideTitle && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">À toi</p>}
      {example.statement && <RichText text={example.statement} className="mb-3 font-medium text-gray-900" />}
      <ol className="list-decimal space-y-2 pl-5 text-gray-700">
        {given.map((step, i) => (
          <li key={`g${i}`}>
            <RichText text={step} />
          </li>
        ))}
        {hidden.slice(0, shown).map((step, i) => (
          <li key={`h${i}`} className="text-indigo-800">
            <RichText text={step} />
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">
        {shown > 0 ? `Étape ${given.length + shown} révélée, ${remaining} restante${remaining > 1 ? "s" : ""}.` : ""}
      </p>
      {remaining > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" variant="outline" onClick={onReveal}>
            Révéler l&apos;étape suivante
          </Button>
          <span className="text-xs text-gray-500">
            Essaie d&apos;abord : {remaining} étape{remaining > 1 ? "s" : ""} à trouver.
          </span>
        </div>
      )}
      {remaining === 0 && example.result && (
        <p className="mt-3 font-medium text-green-700">
          <RichText text={example.result} />
        </p>
      )}
    </Card>
  );
}
