"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cx } from "@/shared/utils/cx";
import { fieldAria } from "@/shared/utils/uiState";

interface FieldExtras {
  /** Libellé visible, associé au champ (`htmlFor`). Sans libellé, fournir `aria-label`. */
  label?: ReactNode;
  /** Aide, référencée par `aria-describedby`. */
  help?: ReactNode;
  /** Message d'erreur : pose `aria-invalid` et est annoncé (`role="alert"`). */
  error?: ReactNode;
  /** `false` pour laisser l'appelant fixer la largeur via `className`. */
  fullWidth?: boolean;
}

const CONTROL_CLASSES =
  "min-h-11 rounded-ctrl border border-line-strong bg-surface px-3.5 text-sm text-ink " +
  "placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent " +
  "aria-invalid:border-err disabled:cursor-not-allowed disabled:opacity-45";

interface ControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
  className: string;
}

/** Prépare l'id et les attributs ARIA, puis enveloppe le contrôle avec libellé / aide / erreur si présents. */
function useField(
  { label, help, error, fullWidth = true }: FieldExtras,
  userId: string | undefined,
  userDescribedBy: string | undefined,
  className: string | undefined,
  extraClasses = "",
) {
  const generated = useId();
  const id = userId ?? generated;
  const aria = fieldAria({ id, help, error });
  const controlProps: ControlProps = {
    id,
    "aria-describedby": [userDescribedBy, aria.describedBy].filter(Boolean).join(" ") || undefined,
    "aria-invalid": aria.invalid,
    className: cx(CONTROL_CLASSES, fullWidth && "block w-full", extraClasses, className),
  };
  const wrap = (control: ReactNode) =>
    label || help || error ? (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        {control}
        {help && (
          <p id={aria.helpId} className="text-xs text-ink-3">
            {help}
          </p>
        )}
        {error && (
          <p id={aria.errorId} role="alert" className="text-xs font-medium text-err">
            {error}
          </p>
        )}
      </div>
    ) : (
      control
    );
  return { controlProps, wrap };
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & FieldExtras;

/** Champ texte natif, 44 px de haut, bordure `line-strong` (3:1). */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, help, error, fullWidth, id, className, "aria-describedby": describedBy, ...props }, ref) => {
    const { controlProps, wrap } = useField({ label, help, error, fullWidth }, id, describedBy, className);
    return wrap(<input ref={ref} {...controlProps} {...props} />);
  },
);
Input.displayName = "Input";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldExtras;

/** `<textarea>` natif, même habillage que `Input`. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, help, error, fullWidth, id, className, "aria-describedby": describedBy, ...props }, ref) => {
    const { controlProps, wrap } = useField({ label, help, error, fullWidth }, id, describedBy, className, "min-h-24 py-2.5");
    return wrap(<textarea ref={ref} {...controlProps} {...props} />);
  },
);
Textarea.displayName = "Textarea";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & FieldExtras;

/** `<select>` natif, même habillage que `Input`. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, help, error, fullWidth, id, className, "aria-describedby": describedBy, children, ...props }, ref) => {
    const { controlProps, wrap } = useField({ label, help, error, fullWidth }, id, describedBy, className, "pr-2");
    return wrap(
      <select ref={ref} {...controlProps} {...props}>
        {children}
      </select>,
    );
  },
);
Select.displayName = "Select";
