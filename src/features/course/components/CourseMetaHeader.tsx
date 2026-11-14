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

const formatBadgeVariant: Record<string, "info" | "ok" | "warn" | "neutral"> = {
  focused_answer: "info",
  full_course: "ok",
  quiz_only: "warn",
};

const MODE_LABELS_RECORD: Record<string, string> = MODE_LABELS;

/**
 * En-tête du cours : kicker (mode et langue réels, en badges), titre en serif et sujet.
 * Aucune donnée inventée : le sujet et la langue ne s'affichent que s'ils sont fournis.
 */
export function CourseMetaHeader({ meta }: CourseMetaHeaderProps) {
  const format = meta.format ?? "focused_answer";
  const variant = formatBadgeVariant[format] ?? "neutral";
  const label = MODE_LABELS_RECORD[format] ?? format;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center gap-2 font-mono">
        <Badge variant={variant}>{label}</Badge>
        {meta.language && <Badge variant="neutral">{meta.language}</Badge>}
      </div>
      <h1 className="mt-3 font-serif text-[clamp(1.5rem,4vw,2rem)] leading-tight font-medium text-ink">{meta.title}</h1>
      {meta.subject && <p className="mt-1.5 text-sm text-ink-3">{meta.subject}</p>}
    </Card>
  );
}
