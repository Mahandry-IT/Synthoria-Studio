"use client";

import { Card } from "@/components/Card";
import { AnswerBlock } from "./AnswerBlock";
import { LatexText } from "@/shared/utils/latex";
import type { CourseSection } from "../course.types";

interface SectionsListProps {
  sections: CourseSection[];
}

/**
 * Affiche la liste des sections du cours.
 * L'API retourne quoi/pourquoi/comment à plat dans chaque section.
 */
export function SectionsList({ sections }: SectionsListProps) {
  if (sections.length === 0) return null;

  return (
    <section aria-labelledby="sections-heading">
      <h2 id="sections-heading" className="text-lg font-semibold text-gray-900 mb-4">
        Sections
      </h2>
      <div className="space-y-6">
        {sections.map((section, i) => {
          const hasContent = section.quoi || section.pourquoi || section.comment ||
            section.worked_example?.steps?.length || section.key_points?.length;

          return (
            <Card key={section.id ?? i} className="p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                <span className="text-indigo-600 mr-2">{i + 1}.</span>
                <LatexText text={section.title} />
              </h3>
              {hasContent ? (
                <AnswerBlock answer={{
                  quoi: section.quoi,
                  pourquoi: section.pourquoi,
                  comment: section.comment,
                  worked_example: section.worked_example,
                  key_points: section.key_points,
                }} />
              ) : section.answer ? (
                <AnswerBlock answer={section.answer} />
              ) : (
                <p className="text-sm text-gray-500 italic">Pas de contenu disponible.</p>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
