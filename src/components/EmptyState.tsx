import type { ReactNode } from "react";
import { cx } from "@/shared/utils/cx";

interface EmptyStateProps {
  icon?: ReactNode;
  /** Message principal (ex. « Aucun plan en attente de validation. »). */
  title: string;
  description?: ReactNode;
  /** Bouton ou lien d'action. */
  action?: ReactNode;
  className?: string;
}

/** État vide : icône, titre serif, texte facultatif et action, dans un cadre en pointillés. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cx("flex flex-col items-center gap-3 rounded-card border border-dashed border-line-strong bg-surface px-5 py-8 text-center", className)}>
      {icon && (
        <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
          {icon}
        </span>
      )}
      <p className="font-serif text-lg font-medium text-ink">{title}</p>
      {description && <p className="max-w-md text-sm text-ink-2">{description}</p>}
      {action}
    </div>
  );
}
