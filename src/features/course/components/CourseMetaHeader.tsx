"use client";

import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { MODE_LABELS } from "@/shared/utils/constants";

interface CourseMetaHeaderProps {
  meta: {
    subject?: string;
    title?: string;
    format?: string;
    language?: string;
  };
}

const formatBadgeVariant: Record<string, "indigo" | "green" | "amber" | "gray"> = {
  focused_answer: "indigo",
  full_course: "green",
  quiz_only: "amber",
};

const MODE_LABELS_RECORD: Record<string, string> = MODE_LABELS;

/**
 * En-tête du cours avec titre, sujet, badge de mode et langue.
 */
export function CourseMetaHeader({ meta }: CourseMetaHeaderProps) {
  const format = meta.format ?? "focused_answer";
  const variant = formatBadgeVariant[format] ?? "gray";
  const label = MODE_LABELS_RECORD[format] ?? format;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{meta.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{meta.subject}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={variant}>{label}</Badge>
          <Badge variant="gray">{meta.language}</Badge>
        </div>
      </div>
    </Card>
  );
}
