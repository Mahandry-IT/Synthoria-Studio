"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { COURSE_TABS, tabForKey, type CourseTabId } from "../courseTabs";

interface CourseTabsProps {
  active: CourseTabId;
  onChange: (tab: CourseTabId) => void;
  /** Contenu de chaque onglet ; seul celui de l'onglet actif est rendu. */
  panels: Record<CourseTabId, ReactNode>;
}

const tabId = (id: CourseTabId) => `course-tab-${id}`;
const panelId = (id: CourseTabId) => `course-panel-${id}`;

/** Onglets Leçons / Exercices corrigés / Quiz (motif WAI-ARIA tabs, activation au focus par les flèches). */
export function CourseTabs({ active, onChange, panels }: CourseTabsProps) {
  const refs = useRef<Partial<Record<CourseTabId, HTMLButtonElement | null>>>({});

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: CourseTabId) {
    const next = tabForKey(current, event.key);
    if (!next) return;
    event.preventDefault();
    onChange(next);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Contenu du cours" className="flex flex-wrap gap-1 border-b border-gray-200">
        {COURSE_TABS.map(({ id, label }) => {
          const selected = id === active;
          return (
            <button
              key={id}
              ref={(el) => {
                refs.current[id] = el;
              }}
              type="button"
              role="tab"
              id={tabId(id)}
              aria-selected={selected}
              aria-controls={panelId(id)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(id)}
              onKeyDown={(e) => handleKeyDown(e, id)}
              className={[
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                selected
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-gray-500 hover:text-gray-800",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

      {COURSE_TABS.map(({ id }) => (
        <div
          key={id}
          role="tabpanel"
          id={panelId(id)}
          aria-labelledby={tabId(id)}
          hidden={id !== active}
          tabIndex={0}
          className="pt-6 focus:outline-none"
        >
          {id === active ? panels[id] : null}
        </div>
      ))}
    </div>
  );
}
