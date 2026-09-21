"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { FadedExample as FadedExampleData } from "../../course.types";
import { RichText } from "../RichText";

/** « À toi » : les premières étapes sont données, les suivantes se révèlent une à une après essai. */
export function FadedExample({ example }: { example: FadedExampleData }) {
  const given = example.given_steps ?? [];
  const hidden = example.hidden_steps ?? [];
  const [revealed, setRevealed] = useState(0);
  const allRevealed = revealed >= hidden.length;

  if (given.length === 0 && hidden.length === 0) return null;

  return (
    <Card className="bg-amber-50 p-4 text-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">À toi</p>
      {example.statement && <RichText text={example.statement} className="mb-3 font-medium text-gray-900" />}
      <ol className="list-decimal space-y-2 pl-5 text-gray-700">
        {given.map((step, i) => (
          <li key={`g${i}`}>
            <RichText text={step} />
          </li>
        ))}
        {hidden.slice(0, revealed).map((step, i) => (
          <li key={`h${i}`} className="text-indigo-800">
            <RichText text={step} />
          </li>
        ))}
        {hidden.slice(revealed).map((_, i) => (
          <li key={`m${i}`} className="text-gray-400" aria-label="Étape masquée">
            …à compléter
          </li>
        ))}
      </ol>
      {!allRevealed && (
        <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => setRevealed((n) => n + 1)}>
          Révéler l&apos;étape suivante
        </Button>
      )}
      {allRevealed && example.result && (
        <p className="mt-3 font-medium text-green-700">
          <RichText text={example.result} />
        </p>
      )}
    </Card>
  );
}
