"use client";

import { useId, useState } from "react";
import { LatexText } from "@/shared/utils/latex";
import type { SectionStatus } from "../sectionProgress";

export interface SectionNavItem {
  key: string;
  title: string;
  status: SectionStatus;
}

const STATUS_LABELS: Record<SectionStatus, string> = {
  done: "faite",
  in_progress: "en cours",
  todo: "à faire",
};

const STATUS_DOTS: Record<SectionStatus, string> = {
  done: "bg-green-500 border-green-500",
  in_progress: "bg-amber-400 border-amber-400",
  todo: "bg-white border-gray-300",
};

interface SectionNavProps {
  items: SectionNavItem[];
  currentKey: string | null;
  onSelect: (key: string) => void;
  /** Résumé affiché sur le bouton de la barre repliable (mobile), ex. « 2/5 terminées ». */
  summary?: string;
}

/**
 * Liste des sections avec leur état (faite / en cours / à faire) et accès direct.
 * Sur mobile, la liste se replie derrière un bouton ; elle reste visible à partir de `lg`.
 */
export function SectionNav({ items, currentKey, onSelect, summary }: SectionNavProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const currentIndex = items.findIndex((item) => item.key === currentKey);

  return (
    <nav aria-label="Sections du cours">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 lg:hidden"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          Section {currentIndex + 1}/{items.length}
          {summary ? <span className="ml-2 font-normal text-gray-500">· {summary}</span> : null}
        </span>
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>
      <ol
        id={listId}
        className={`${open ? "block" : "hidden"} mt-2 max-h-[70vh] lg:max-h-[calc(100vh-6rem)] space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 lg:mt-0 lg:block`}
      >
        {items.map((item, i) => {
          const isCurrent = item.key === currentKey;
          return (
            <li key={item.key}>
              <button
                type="button"
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => {
                  onSelect(item.key);
                  setOpen(false);
                }}
                className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isCurrent ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border ${STATUS_DOTS[item.status]}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="mr-1 text-gray-400">{i + 1}.</span>
                  <LatexText text={item.title} />
                  <span className="sr-only"> ({STATUS_LABELS[item.status]})</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
