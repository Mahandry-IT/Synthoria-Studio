"use client";

import { Card } from "@/components/Card";
import { AnswerBlock } from "./AnswerBlock";
import { LatexText } from "@/shared/utils/latex";
import { BlockRenderer } from "./blocks/BlockRenderer";
import type { CourseSection } from "../course.types";

interface SectionsListProps {
  sections: CourseSection[];
}

/**
 * Affiche la liste des sections du cours.
 * Rendu par blocs typés (`subsections`) quand l'API les fournit ; sinon rendu legacy
 * quoi/pourquoi/comment (sessions historiques).
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
          const subsections = (section.subsections ?? []).filter((s) => s.blocks.length > 0);
          const hasContent = section.quoi || section.pourquoi || section.comment ||
            section.worked_example?.steps?.length || section.key_points?.length || section.tables?.length;

          return (
            <Card key={section.id ?? i} className="p-5">
              <h3 className="text-base font-semibold text-indigo-600 mb-3">
                <span className="mr-2">{i + 1}.</span>
                <LatexText text={section.title.replace(/^\d+\.\s*/, '')} />
              </h3>
              {subsections.length > 0 ? (
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
              ) : hasContent ? (
                <AnswerBlock answer={{
                  quoi: section.quoi,
                  pourquoi: section.pourquoi,
                  comment: section.comment,
                  worked_example: section.worked_example,
                  key_points: section.key_points,
                  tables: section.tables,
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
