"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cx } from "@/shared/utils/cx";

/** `outline` est l'ancien nom de `secondary` (conservé tant que les écrans ne sont pas migrés). */
type ButtonVariant = "primary" | "accent" | "secondary" | "outline" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
} & (
    | { size?: "md" | "sm" }
    /** Bouton icône 44 × 44 : le nom accessible est obligatoire. */
    | { size: "icon"; "aria-label": string }
  );

const SECONDARY = "bg-surface text-ink border-line-strong hover:bg-sunken";

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-ink border-transparent",
  accent: "bg-accent text-accent-ink border-transparent",
  secondary: SECONDARY,
  outline: SECONDARY,
  ghost: "bg-transparent text-primary border-transparent hover:bg-sunken",
  danger: "bg-err text-primary-ink border-transparent",
};

const SIZE_CLASSES = {
  md: "min-h-11 px-4.5 text-sm",
  sm: "min-h-9 px-3 text-xs",
  icon: "h-11 w-11 p-0 text-sm",
} as const;

/**
 * Bouton réutilisable : variantes, tailles (`md` 44 px, `sm`, `icon` 44 × 44) et état `loading`.
 * Le survol soulève le bouton d'1 px (désactivé sous `prefers-reduced-motion`).
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, disabled, className = "", children, ...props }, ref) => {
    const isDisabled = disabled === true || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        suppressHydrationWarning
        className={cx(
          "inline-flex items-center justify-center gap-2 rounded-ctrl border font-semibold whitespace-nowrap",
          "transition-[background-color,transform] duration-(--d-fast) ease-(--ease-editorial)",
          "enabled:hover:-translate-y-px motion-reduce:transition-none motion-reduce:enabled:hover:translate-y-0",
          "disabled:cursor-not-allowed disabled:opacity-45",
          SIZE_CLASSES[size],
          BUTTON_VARIANT_CLASSES[variant],
          className,
        )}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
export { Button };
