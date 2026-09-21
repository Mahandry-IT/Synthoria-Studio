"use client";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { AnswerBlock } from "./AnswerBlock";
import { LatexText } from "@/shared/utils/latex";
import { BlockRenderer } from "./blocks/BlockRenderer";
import { ChallengeCard } from "./learning/ChallengeCard";
import { FadedExample } from "./learning/FadedExample";
import { RecallBox } from "./learning/RecallBox";
import { SectionCheck } from "./learning/SectionCheck";
import { useSectionProgress } from "../hooks/useSectionProgress";
import { isExplanationVisible, isTrackable, sectionKey } from "../sectionProgress";
import type { CourseSection } from "../course.types";

interface SectionsListProps {
  sections: CourseSection[];
  /** Id de la session persistée : requis pour évaluer les reformulations (absent → pas de « Explique avec tes mots »). */
  sessionId?: string | null;
  /** Identifiant du cours pour la progression (session, à défaut titre du cours). */
  courseKey: string;
}

/** Contenu explicatif d'une section : blocs typés si présents, sinon rendu legacy quoi/pourquoi/comment. */
function SectionExplanation({ section }: { section: CourseSection }) {
  const subsections = (section.subsections ?? []).filter((s) => s.blocks.length > 0);
  const hasContent =
    section.quoi || section.pourquoi || section.comment ||
    section.worked_example?.steps?.length || section.key_points?.length || section.tables?.length;

  if (subsections.length > 0) {
    return (
      <div className="space-y-4">
        {subsections.map((sub, j) => (
          <div key={j}>
            {sub.title && <h4 className="mb-1 text-sm font-medium text-gray-900">{sub.title}</h4>}
            <BlockRenderer blocks={sub.blocks} />
          </div>
        ))}
        {section.key_points && section.key_points.length > 0 && (
          <AnswerBlock answer={{ key_points: section.key_points }} />
        )}
      </div>
    );
  }
  if (hasContent) {
    return (
      <AnswerBlock
        answer={{
          quoi: section.quoi,
          pourquoi: section.pourquoi,
          comment: section.comment,
          worked_example: section.worked_example,
          key_points: section.key_points,
          tables: section.tables,
        }}
      />
    );
  }
  if (section.answer) return <AnswerBlock answer={section.answer} />;
  return <p className="text-sm text-gray-500 italic">Pas de contenu disponible.</p>;
}

/**
 * Affiche la liste des sections du cours en suivant le cycle pédagogique :
 * Défi → explication (Pourquoi/Quoi/Comment) → À toi → Vérifie → Explique avec tes mots.
 * Les sections sans éléments de cycle (sessions historiques) s'affichent comme avant.
 * La progression (défi relevé, section terminée) est conservée le temps de la session du navigateur.
 */
export function SectionsList({ sections, sessionId, courseKey }: SectionsListProps) {
  const { progress, unlock, complete } = useSectionProgress(courseKey);

  if (sections.length === 0) return null;

  const tracked = sections.filter((s) => isTrackable(s.check_questions?.length ?? 0));
  const doneCount = tracked.filter((s) => progress.done.includes(sectionKey(s.id, sections.indexOf(s)))).length;

  return (
    <section aria-labelledby="sections-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="sections-heading" className="text-lg font-semibold text-gray-900">
          Sections
        </h2>
        {tracked.length > 0 && (
          <span className="text-sm text-gray-500" aria-live="polite">
            {doneCount}/{tracked.length} terminée{tracked.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="space-y-6">
        {sections.map((section, i) => {
          const id = sectionKey(section.id, i);
          const hasChallenge = Boolean(section.challenge);
          const visible = isExplanationVisible(progress, id, hasChallenge);
          const checks = section.check_questions ?? [];
          const done = progress.done.includes(id);

          return (
            <Card key={id} className="p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-indigo-600">
                  <span className="mr-2">{i + 1}.</span>
                  <LatexText text={section.title.replace(/^\d+\.\s*/, "")} />
                </h3>
                {done && <Badge variant="green">Terminée</Badge>}
              </div>

              <div className="space-y-4">
                {hasChallenge && !visible && (
                  <ChallengeCard challenge={section.challenge ?? ""} onUnlock={() => unlock(id)} />
                )}

                {visible && (
                  <>
                    <SectionExplanation section={section} />
                    {section.faded_example && <FadedExample example={section.faded_example} />}
                    <SectionCheck questions={checks} onComplete={() => complete(id)} />
                    {sessionId && section.id && section.recall_prompt && (
                      <RecallBox sessionId={sessionId} sectionId={section.id} prompt={section.recall_prompt} />
                    )}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
