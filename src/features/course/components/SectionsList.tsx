"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { SectionAside } from "./SectionAside";
import { SectionNav } from "./SectionNav";
import { CycleReader } from "./cycle/CycleReader";
import { focusAfterRender, SectionReader } from "./SectionReader";
import { IncompleteCourseBanner } from "./learning/IncompleteCourseBanner";
import { countIncompleteSections } from "../incompleteCourse";
import { cycleDurationLabel } from "../cycleDuration";
import { hasCycle } from "../cycleFormat";
import { useCycleProgress } from "../hooks/useCycleProgress";
import { useSectionProgress } from "../hooks/useSectionProgress";
import {
  adjacentSection,
  isTrackable,
  resolveCurrentSection,
  sectionKey,
  sectionStatus,
  setCurrentSection,
} from "../sectionProgress";
import type {
  CourseGenerationResponse,
  CourseSection,
  CourseVideo,
  RegenerateIncompleteSectionsResponse,
} from "../course.types";

interface SectionsListProps {
  sections: CourseSection[];
  /** Id de la session persistée : requis pour analyser le défi et évaluer les reformulations. */
  sessionId?: string | null;
  /** Identifiant du cours pour la progression (session, à défaut titre du cours). */
  courseKey: string;
  /** Vidéos rattachées aux sections, par `id` de section (cf. `splitVideosBySection`). */
  videosBySection?: ReadonlyMap<string, CourseVideo[]>;
  onVideoNoteSaved?: (videoId: string, note: string) => void;
  /** Cours livré sans résumé ou sans quiz : propose la régénération complète même sans section incomplète. */
  missingWrapUp?: boolean;
  /** Le cours entier a été régénéré : le parent remplace le cours affiché. */
  onCourseRegenerated?: (course: CourseGenerationResponse) => void;
  /** Exercice rédigé par section (liste prête seulement) : active « Faire l'exercice » en fin de section. */
  sectionExercises?: ReadonlyMap<string, { id: string }>;
  onDoExercise?: (exerciseId: string) => void;
}

export const headingIdOf = (index: number) => `section-${index}-heading`;

/**
 * Lecteur de cours, une section à la fois : navigation (état fait / en cours / à faire, Précédent /
 * Suivant, accès direct) et dévoilement progressif du cycle pédagogique dans chaque section.
 * La section courante et la progression sont conservées le temps de la session du navigateur.
 */
export function SectionsList({
  sections,
  sessionId,
  courseKey,
  videosBySection,
  onVideoNoteSaved,
  missingWrapUp = false,
  onCourseRegenerated,
  sectionExercises,
  onDoExercise,
}: SectionsListProps) {
  const { progress, update } = useSectionProgress(courseKey);
  const { cycleProgress, updateCycle } = useCycleProgress(courseKey);
  // Régénération et notes : appliquées en local par-dessus les sections reçues (comme la progression),
  // sans dépendre d'un état mutable détenu par le parent (page Ask ou historique).
  const [overrides, setOverrides] = useState<Record<string, Partial<CourseSection>>>({});
  // Régénération groupée ou complète en cours : les boutons « Régénérer cette section » sont
  // désactivés, le serveur traitant déjà ces sections (il refuserait un second appel).
  const [regenerating, setRegenerating] = useState(false);

  if (sections.length === 0) return null;

  const keys = sections.map((s, i) => sectionKey(s.id, i));
  const currentKey = resolveCurrentSection(progress, keys);
  const currentIndex = currentKey === null ? 0 : Math.max(keys.indexOf(currentKey), 0);
  const id = keys[currentIndex];
  const section = { ...sections[currentIndex], ...overrides[id] };
  const incompleteCount = countIncompleteSections(sections.map((s, i) => ({ ...s, ...overrides[keys[i]] })));

  // Les sections régénérées gardent leur `id` : c'est aussi leur clé de progression et d'override.
  const applyRegenerated = (result: RegenerateIncompleteSectionsResponse) =>
    setOverrides((current) => ({
      ...current,
      ...Object.fromEntries(
        result.regenerated.flatMap((s) => (s.id ? [[s.id, { ...current[s.id], ...s }] as const] : [])),
      ),
    }));

  const tracked = sections.filter((s) => isTrackable(s.check_questions?.length ?? 0));
  const doneCount = tracked.filter((s) => progress.done.includes(sectionKey(s.id, sections.indexOf(s)))).length;
  const summary =
    tracked.length > 0 ? `${doneCount}/${tracked.length} terminée${tracked.length > 1 ? "s" : ""}` : undefined;

  const goTo = (key: string | null) => {
    if (key === null) return;
    update((p) => setCurrentSection(p, key));
    focusAfterRender(headingIdOf(keys.indexOf(key)));
  };
  const onOverride = (patch: Partial<CourseSection>) =>
    setOverrides((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  const exercise = section.id ? sectionExercises?.get(section.id) : undefined;
  const previous = adjacentSection(keys, id, -1);
  const next = adjacentSection(keys, id, 1);

  return (
    <section aria-labelledby="sections-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="sections-heading" className="kicker">
          Sections
        </h2>
        {summary && (
          <span className="font-mono text-xs text-ink-3" aria-live="polite">
            {summary}
          </span>
        )}
      </div>

      {sessionId && onCourseRegenerated && (
        <IncompleteCourseBanner
          sessionId={sessionId}
          incompleteCount={incompleteCount}
          missingWrapUp={missingWrapUp}
          onSectionsRegenerated={applyRegenerated}
          onCourseRegenerated={onCourseRegenerated}
          onBusyChange={setRegenerating}
        />
      )}

      <div className="mb-5">
        <SectionNav
          items={sections.map((s, i) => ({
            key: keys[i],
            title: ({ ...s, ...overrides[keys[i]] }.title ?? "").replace(/^\d+\.\s*/, ""),
            duration: cycleDurationLabel({ ...s, ...overrides[keys[i]] }),
            status: sectionStatus({ ...progress, current: id }, keys[i]),
          }))}
          currentKey={id}
          onSelect={goTo}
        />
      </div>

      {/* La coquille reste en max-w-4xl : la colonne de repères n'apparaît qu'à partir de xl. */}
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_13rem] xl:gap-8">
        <div className="min-w-0 space-y-4">
          {hasCycle(section) && section.cycle ? (
            <CycleReader
              key={id}
              section={{ ...section, cycle: section.cycle }}
              index={currentIndex}
              progressKey={id}
              headingId={headingIdOf(currentIndex)}
              sessionId={sessionId}
              progress={progress}
              update={update}
              cycleProgress={cycleProgress}
              updateCycle={updateCycle}
              onOverride={onOverride}
              videos={section.id ? videosBySection?.get(section.id) : undefined}
              onVideoNoteSaved={onVideoNoteSaved}
              onDoExercise={exercise && onDoExercise ? () => onDoExercise(exercise.id) : undefined}
            />
          ) : (
            <SectionReader
              key={id}
              section={section}
              index={currentIndex}
              progressKey={id}
              headingId={headingIdOf(currentIndex)}
              sessionId={sessionId}
              progress={progress}
              update={update}
              onOverride={onOverride}
              videos={section.id ? videosBySection?.get(section.id) : undefined}
              onVideoNoteSaved={onVideoNoteSaved}
              regenerationLocked={regenerating}
              onDoExercise={exercise && onDoExercise ? () => onDoExercise(exercise.id) : undefined}
            />
          )}

          {sections.length > 1 && (
            <div className="flex items-center justify-between gap-2">
              <Button type="button" variant="secondary" disabled={previous === null} onClick={() => goTo(previous)}>
                ← Section précédente
              </Button>
              {/* Sous sm, le numéro courant est déjà lisible dans le fil des chapitres : on garde la place aux deux boutons. */}
              <span className="hidden font-mono text-xs text-ink-3 sm:inline">
                {currentIndex + 1} / {sections.length}
              </span>
              <Button type="button" variant="secondary" disabled={next === null} onClick={() => goTo(next)}>
                Section suivante →
              </Button>
            </div>
          )}
        </div>
        <SectionAside
          index={currentIndex}
          total={sections.length}
          duration={cycleDurationLabel(section)}
          summary={summary}
        />
      </div>
    </section>
  );
}
