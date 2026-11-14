"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "@/shared/utils/cx";

type CheckType = "checkbox" | "radio";

interface CheckInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  /** `checkbox` (défaut) ou `radio`. */
  type?: CheckType;
}

/** Contrôle natif (`<input>`) habillé : 22 px, bordure `line-strong`, coche ou point en `primary-ink`. */
const Mark = forwardRef<HTMLInputElement, CheckInputProps>(({ type = "checkbox", className, ...props }, ref) => (
  <span className="relative inline-flex h-[22px] w-[22px] shrink-0">
    <input
      ref={ref}
      type={type}
      className={cx(
        "peer h-full w-full cursor-pointer appearance-none border-[1.5px] border-line-strong bg-surface",
        "checked:border-primary checked:bg-primary disabled:cursor-not-allowed disabled:not-checked:opacity-45",
        type === "radio" ? "rounded-full" : "rounded-[4px]",
        className,
      )}
      {...props}
    />
    {type === "radio" ? (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[6px] hidden rounded-full bg-primary-ink peer-checked:block"
      />
    ) : (
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute inset-0 m-auto hidden h-3.5 w-3.5 text-primary-ink peer-checked:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 8.5l3.2 3L13 4.5" />
      </svg>
    )}
  </span>
));
Mark.displayName = "Mark";

interface CheckProps extends CheckInputProps {
  label: ReactNode;
}

/** Case à cocher ou radio natif avec libellé cliquable ; la ligne entière fait au moins 44 px. */
export const Check = forwardRef<HTMLInputElement, CheckProps>(({ label, ...props }, ref) => (
  <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
    <Mark ref={ref} {...props} />
    <span>{label}</span>
  </label>
));
Check.displayName = "Check";

/** Ton d'une option corrigée : bonne réponse (`ok`) ou choix erroné (`err`). */
type OptionTone = "ok" | "err";

const OPTION_TONE_CLASSES: Record<OptionTone, string> = {
  ok: "border-ok bg-ok-soft",
  err: "border-err bg-err-soft",
};

interface OptionProps extends CheckProps {
  /** État après validation ; remplace le style « coché ». Le sens doit aussi passer par le libellé. */
  tone?: OptionTone;
}

/** Option en carte sélectionnable (radio par défaut) : bordure et fond `primary` quand elle est cochée. */
export const Option = forwardRef<HTMLInputElement, OptionProps>(({ label, type = "radio", tone, ...props }, ref) => (
  <label
    className={cx(
      "flex min-h-11 w-full cursor-pointer items-start gap-3.5 rounded-card border px-4 py-3.5",
      "text-left text-[15px] leading-normal text-ink",
      tone ? OPTION_TONE_CLASSES[tone] : "border-line bg-bg has-[:checked]:border-primary has-[:checked]:bg-primary-soft",
      "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
    )}
  >
    <Mark ref={ref} type={type} {...props} />
    <span className="min-w-0 flex-1">{label}</span>
  </label>
));
Option.displayName = "Option";
