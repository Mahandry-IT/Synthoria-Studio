"use client";

import { Card } from "@/components/Card";
import { AnswerBlock } from "./AnswerBlock";
import type { CourseSection } from "../course.types";

interface SectionsListProps {
  sections: CourseSection[];
}

/**
 * Affiche la liste des sections du cours.
 * ⚠️ Affiché si `sections` non null, indépendamment de `format`.
 * Chaque section contient un titre et un bloc réponse structuré.
 */
export function SectionsList({ sections }: SectionsListProps) {
  if (sections.length === 0) return null;

  return (
    <section aria-labelledby="sections-heading">
      <h2 id="sections-heading" className="text-lg font-semibold text-gray-900 mb-4">
        Sections
      </h2>
      <div className="space-y-6">
        {sections.map((section, i) => (
          <Card key={i} className="p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              <span className="text-indigo-600 mr-2">{i + 1}.</span>
              {section.title}
            </h3>
            <AnswerBlock answer={section.answer} />
          </Card>
        ))}
      </div>
    </section>
  );
}
