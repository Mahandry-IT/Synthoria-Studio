"use client";

import { useRef, useSyncExternalStore, type KeyboardEvent } from "react";
import { cx } from "@/shared/utils/cx";
import { sectionForKey, type CourseSectionDef, type CourseSectionId } from "../courseSections";
import { CourseSectionIcon } from "./courseIcons";

export const sectionTabId = (id: CourseSectionId) => `course-section-tab-${id}`;
export const sectionPanelId = (id: CourseSectionId) => `course-section-panel-${id}`;

const DESKTOP_QUERY = "(min-width: 1024px)";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function subscribeDesktop(listener: () => void): () => void {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

/** Vrai à partir de lg (barre verticale) ; faux au rendu serveur, relu au montage. */
function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

interface CourseIconNavProps {
  sections: readonly CourseSectionDef[];
  active: CourseSectionId;
  onChange: (id: CourseSectionId) => void;
}

/**
 * Barre d'icônes des blocs du cours : colonne collante à gauche du contenu (≥ lg), barre fixe en bas
 * sinon. Motif WAI-ARIA tabs (activation au focus par les flèches) ; les panneaux sont rendus par
 * le parent avec `sectionPanelId` / `sectionTabId`.
 */
export function CourseIconNav({ sections, active, onChange }: CourseIconNavProps) {
  const refs = useRef<Partial<Record<CourseSectionId, HTMLButtonElement | null>>>({});
  const isDesktop = useIsDesktop();

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: CourseSectionId) {
    const next = sectionForKey(current, event.key, sections);
    if (!next) return;
    event.preventDefault();
    onChange(next);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Blocs du cours"
      aria-orientation={isDesktop ? "vertical" : "horizontal"}
      className={cx(
        // pr : laisse libre le coin du bouton « retour en haut » (fixed bottom-6 right-6, 44 px)
        "fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] max-lg:pr-[4.5rem]",
        "lg:sticky lg:inset-x-auto lg:bottom-auto lg:top-4 lg:z-10 lg:w-14 lg:shrink-0 lg:flex-col lg:gap-1.5",
        "lg:self-start lg:rounded-card lg:border lg:p-1.5 lg:pb-1.5 lg:shadow-paper",
      )}
    >
      {sections.map(({ id, label, name, icon }) => {
        const selected = id === active;
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[id] = el;
            }}
            type="button"
            role="tab"
            id={sectionTabId(id)}
            aria-selected={selected}
            aria-controls={sectionPanelId(id)}
            aria-label={name}
            title={isDesktop ? name : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => handleKeyDown(e, id)}
            className={cx(
              "flex min-h-14 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
              "transition-colors duration-(--d-fast) motion-reduce:transition-none",
              "lg:min-h-11 lg:flex-none lg:rounded-ctrl",
              selected
                ? "text-ink lg:bg-primary lg:text-primary-ink"
                : "text-ink-2 hover:bg-sunken hover:text-ink",
              FOCUS,
            )}
          >
            <span
              className={cx(
                "flex h-7 w-11 items-center justify-center rounded-full lg:h-auto lg:w-auto",
                selected && "max-lg:bg-primary max-lg:text-primary-ink",
              )}
            >
              <CourseSectionIcon name={icon} />
            </span>
            <span className="lg:sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
