"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { SectionNav } from "./SectionNav";
import { focusAfterRender, SectionReader } from "./SectionReader";
import { useSectionProgress } from "../hooks/useSectionProgress";
import {
  adjacentSection,
  isTrackable,
  resolveCurrentSection,
  sectionKey,
  sectionStatus,
  setCurrentSection,
} from "../sectionProgress";
import type { CourseSection } from "../course.types";

interface SectionsListProps {
  sections: CourseSection[];
  /** Id de la session persistée : requis pour analyser le défi et évaluer les reformulations. */
  sessionId?: string | null;
  /** Identifiant du cours pour la progression (session, à défaut titre du cours). */
  courseKey: string;
}

const headingIdOf = (index: number) => `section-${index}-heading`;

/**
 * Lecteur de cours, une section à la fois : navigation (état fait / en cours / à faire, Précédent /
 * Suivant, accès direct) et dévoilement progressif du cycle pédagogique dans chaque section.
 * La section courante et la progression sont conservées le temps de la session du navigateur.
 */
export function SectionsList({ sections, sessionId, courseKey }: SectionsListProps) {
  const { progress, update } = useSectionProgress(courseKey);
  // Régénération et notes : appliquées en local par-dessus les sections reçues (comme la progression),
  // sans dépendre d'un état mutable détenu par le parent (page Ask ou historique).
  const [overrides, setOverrides] = useState<Record<string, Partial<CourseSection>>>({});

  if (sections.length === 0) return null;

  const keys = sections.map((s, i) => sectionKey(s.id, i));
  const currentKey = resolveCurrentSection(progress, keys);
  const currentIndex = currentKey === null ? 0 : Math.max(keys.indexOf(currentKey), 0);
  const id = keys[currentIndex];
  const section = { ...sections[currentIndex], ...overrides[id] };

  const tracked = sections.filter((s) => isTrackable(s.check_questions?.length ?? 0));
  const doneCount = tracked.filter((s) => progress.done.includes(sectionKey(s.id, sections.indexOf(s)))).length;
  const summary =
    tracked.length > 0 ? `${doneCount}/${tracked.length} terminée${tracked.length > 1 ? "s" : ""}` : undefined;

  const goTo = (key: string | null) => {
    if (key === null) return;
    update((p) => setCurrentSection(p, key));
    focusAfterRender(headingIdOf(keys.indexOf(key)));
  };
  const previous = adjacentSection(keys, id, -1);
  const next = adjacentSection(keys, id, 1);

  return (
    <section aria-labelledby="sections-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="sections-heading" className="text-lg font-semibold text-gray-900">
          Sections
        </h2>
        {summary && (
          <span className="text-sm text-gray-500" aria-live="polite">
            {summary}
          </span>
        )}
      </div>

      <div className="gap-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="mb-4 lg:sticky lg:top-4 lg:mb-0 lg:self-start">
          <SectionNav
            items={sections.map((s, i) => ({
              key: keys[i],
              title: ({ ...s, ...overrides[keys[i]] }.title ?? "").replace(/^\d+\.\s*/, ""),
              status: sectionStatus({ ...progress, current: id }, keys[i]),
            }))}
            currentKey={id}
            onSelect={goTo}
            summary={summary}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <SectionReader
            key={id}
            section={section}
            index={currentIndex}
            progressKey={id}
            headingId={headingIdOf(currentIndex)}
            sessionId={sessionId}
            progress={progress}
            update={update}
            onOverride={(patch) => setOverrides((current) => ({ ...current, [id]: { ...current[id], ...patch } }))}
          />

          {sections.length > 1 && (
            <div className="flex items-center justify-between gap-2">
              <Button type="button" variant="secondary" size="sm" disabled={previous === null} onClick={() => goTo(previous)}>
                ← Section précédente
              </Button>
              <span className="text-xs text-gray-500">
                {currentIndex + 1} / {sections.length}
              </span>
              <Button type="button" variant="secondary" size="sm" disabled={next === null} onClick={() => goTo(next)}>
                Section suivante →
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
