import { chapterNumber, sectionCountLabel } from "../readerLayout";

interface SectionAsideProps {
  /** Position 0-based de la section affichée. */
  index: number;
  total: number;
  /** Durée estimée (« ~5 min ») ; absente des anciens cours : rien n'est affiché. */
  duration?: string | null;
  /** Avancement du cours (« 2/5 terminées ») ; absent sans section à valider. */
  summary?: string;
}

/**
 * Repères de la section affichée, en colonne latérale (`xl` et plus seulement : la coquille reste en
 * `max-w-4xl`). Uniquement des données du cours : numéro, total, durée, avancement.
 * Le numéro décoratif est masqué aux lecteurs d'écran, qui lisent « Section 4 sur 12 sections ».
 */
export function SectionAside({ index, total, duration, summary }: SectionAsideProps) {
  return (
    <aside aria-label="Repères de la section" className="hidden xl:block">
      <div className="sticky top-4 flex flex-col gap-3">
        <p className="num text-[5.5rem] text-primary" aria-hidden="true">
          {chapterNumber(index)}
        </p>
        <p className="font-mono text-xs text-ink-3">
          <span className="sr-only">Section {index + 1} </span>
          {sectionCountLabel(total)}
        </p>
        <hr className="rule-2" />
        {(duration || summary) && (
          <ul className="space-y-1 text-sm text-ink-2">
            {duration && <li>{duration}</li>}
            {summary && <li>{summary}</li>}
          </ul>
        )}
      </div>
    </aside>
  );
}
