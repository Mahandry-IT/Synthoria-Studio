"use client";

import { useId, type ReactNode } from "react";
import { LatexText } from "@/shared/utils/latex";

/** Cible tactile minimale (~44 px) pour les contrôles du cycle. */
export const TOUCH_TARGET = "min-h-11";

type Tone = "success" | "info" | "warn";

const TONE_CLASSES: Record<Tone, string> = {
  success: "border-green-200 bg-green-50 text-green-900",
  info: "border-gray-200 bg-gray-50 text-gray-800",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
};

/** Préfixe textuel : l'information ne repose jamais sur la seule couleur. */
const TONE_PREFIX: Record<Tone, string> = { success: "✓ ", info: "", warn: "⚠ " };

/**
 * Retour annoncé aux lecteurs d'écran. La région `aria-live` est toujours rendue (même vide) :
 * c'est son contenu qui change, ce que les technologies d'assistance annoncent.
 */
export function LiveNote({ tone = "info", children }: { tone?: Tone; children?: ReactNode }) {
  return (
    <div aria-live="polite">
      {children ? (
        <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${TONE_CLASSES[tone]}`}>
          <span aria-hidden="true">{TONE_PREFIX[tone]}</span>
          {children}
        </div>
      ) : null}
    </div>
  );
}

interface ChoiceListProps {
  legend: ReactNode;
  options: readonly string[];
  selected: readonly number[];
  onChange: (next: number[]) => void;
  /** Cases à cocher (plusieurs réponses) ou boutons radio (une seule). */
  multiple: boolean;
  disabled?: boolean;
  /** Marques affichées après correction : jamais seulement de la couleur (symbole + texte caché). */
  marks?: Readonly<Record<number, "correct" | "wrong">>;
}

/** Liste de choix accessible : `fieldset`/`legend`, vrais champs natifs, cibles tactiles de 44 px. */
export function ChoiceList({ legend, options, selected, onChange, multiple, disabled = false, marks }: ChoiceListProps) {
  const name = useId();
  const toggle = (i: number) => {
    if (disabled) return;
    if (!multiple) return onChange([i]);
    onChange(selected.includes(i) ? selected.filter((v) => v !== i) : [...selected, i]);
  };
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="mb-2 text-sm font-medium text-gray-900">{legend}</legend>
      {options.map((option, i) => {
        const mark = marks?.[i];
        return (
          <label
            key={i}
            className={`flex ${TOUCH_TARGET} items-start gap-3 rounded-lg border p-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-indigo-500 ${
              disabled ? "cursor-default" : "cursor-pointer hover:bg-gray-50"
            } ${mark === "correct" ? "border-green-400 bg-green-50" : mark === "wrong" ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              checked={selected.includes(i)}
              disabled={disabled}
              onChange={() => toggle(i)}
              className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 focus:outline-none"
            />
            <span className="min-w-0 flex-1 text-gray-700">
              <LatexText text={option} autoMath />
            </span>
            {mark && (
              <span className="shrink-0 text-xs font-medium" aria-hidden="true">
                {mark === "correct" ? "✓" : "✗"}
              </span>
            )}
            {mark && <span className="sr-only">{mark === "correct" ? "(bonne réponse)" : "(incorrecte)"}</span>}
          </label>
        );
      })}
    </fieldset>
  );
}

/** Titre de temps du cycle (h4) : cible du focus quand le temps est dévoilé. */
export function StageHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h4
      id={id}
      tabIndex={-1}
      className="mb-3 text-sm font-semibold text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {children}
    </h4>
  );
}
