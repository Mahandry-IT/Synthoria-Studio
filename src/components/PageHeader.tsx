import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Petite ligne mono au-dessus du titre (date, total…) ; absente tant que la donnée n'est pas chargée. */
  kicker?: ReactNode;
  title: string;
  description?: ReactNode;
  /** Actions principales, alignées à droite (sous le titre en mobile). */
  actions?: ReactNode;
}

/** En-tête de page « carnet éditorial » : kicker mono, `h1` en Fraunces, description et actions. */
export function PageHeader({ kicker, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0 flex-1 basis-72">
        {kicker && <p className="kicker">{kicker}</p>}
        <h1 className="mt-2 font-serif text-[clamp(1.75rem,5vw,2.5rem)] leading-tight font-medium text-ink">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

interface SectionHeadingProps {
  id?: string;
  title: string;
  /** Élément à droite du titre (compteur, lien, badge). */
  aside?: ReactNode;
}

/** Titre de section à filet inférieur (`h2` en Fraunces). */
export function SectionHeading({ id, title, aside }: SectionHeadingProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
      <h2 id={id} className="font-serif text-xl font-medium text-ink">
        {title}
      </h2>
      {aside}
    </div>
  );
}
