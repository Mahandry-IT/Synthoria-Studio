"use client";

import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { MODE_LABELS } from "@/shared/utils/constants";
import type { CourseMeta } from "../course.types";

interface CourseMetaHeaderProps {
  meta: CourseMeta;
}

const formatBadgeVariant = {
  focused_answer: "indigo" as const,
  full_course: "green" as const,
  quiz_only: "amber" as const,
};

/**
 * En-tête du cours avec titre, sujet, badge de mode et langue.
 */
export function CourseMetaHeader({ meta }: CourseMetaHeaderProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{meta.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{meta.subject}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={formatBadgeVariant[meta.format]}>
            {MODE_LABELS[meta.format] ?? meta.format}
          </Badge>
          <Badge variant="gray">{meta.language}</Badge>
        </div>
      </div>
    </Card>
  );
}
