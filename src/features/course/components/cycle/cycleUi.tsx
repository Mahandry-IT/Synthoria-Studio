"use client";

import { useId, type ReactNode } from "react";
import { Option } from "@/components/Check";
import { LatexText } from "@/shared/utils/latex";

type Tone = "success" | "info" | "warn";

const TONE_CLASSES: Record<Tone, string> = {
  success: "border-ok bg-ok-soft text-ink",
  info: "border-line bg-sunken text-ink",
  warn: "border-warn bg-warn-soft text-ink",
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
        <div className={`mt-3 rounded-ctrl border px-3.5 py-2.5 text-sm leading-relaxed ${TONE_CLASSES[tone]}`}>
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

/**
 * Liste de choix accessible : `fieldset`/`legend`, vrais champs natifs (via `Option`), cibles tactiles de 44 px.
 * Après correction, `Option` prend le ton `ok` / `err` ; le symbole et le texte masqué portent le sens.
 */
export function ChoiceList({ legend, options, selected, onChange, multiple, disabled = false, marks }: ChoiceListProps) {
  const name = useId();
  const toggle = (i: number) => {
    if (disabled) return;
    if (!multiple) return onChange([i]);
    onChange(selected.includes(i) ? selected.filter((v) => v !== i) : [...selected, i]);
  };
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="mb-2 text-sm font-medium text-ink">{legend}</legend>
      {options.map((option, i) => {
        const mark = marks?.[i];
        return (
          <Option
            key={i}
            type={multiple ? "checkbox" : "radio"}
            name={name}
            checked={selected.includes(i)}
            disabled={disabled}
            onChange={() => toggle(i)}
            tone={mark === "correct" ? "ok" : mark === "wrong" ? "err" : undefined}
            label={
              <span className="flex items-start gap-3">
                <span className="min-w-0 flex-1">
                  <LatexText text={option} autoMath />
                </span>
                {mark && (
                  <span className={`shrink-0 text-xs font-semibold ${mark === "correct" ? "text-ok" : "text-err"}`} aria-hidden="true">
                    {mark === "correct" ? "✓" : "✗"}
                  </span>
                )}
                {mark && <span className="sr-only">{mark === "correct" ? "(bonne réponse)" : "(incorrecte)"}</span>}
              </span>
            }
          />
        );
      })}
    </fieldset>
  );
}

/**
 * Titre de temps du cycle (h4) : cible du focus quand le temps est dévoilé. Un temps franchi
 * (`done`) passe en `ink-2`. L'anneau de focus `accent` vient de la règle globale `:focus-visible`.
 */
export function StageHeading({ id, done = false, children }: { id: string; done?: boolean; children: ReactNode }) {
  return (
    <h4
      id={id}
      tabIndex={-1}
      className={`mb-3 font-serif text-lg font-semibold leading-snug ${
        done ? "text-ink-2" : "text-ink"
      }`}
    >
      {children}
    </h4>
  );
}
