"use client";

import { use } from "react";
import { useCourseHistoryDetail } from "@/features/history/hooks/useCourseHistoryDetail";
import { CourseView } from "@/features/course/components/CourseView";
import { Skeleton } from "@/components/Skeleton";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { RichTextView } from "@/components/editor/RichTextView";
import { HttpError } from "@/shared/api/httpClient";

/**
 * Page de détail d'un cours historique.
 */
export default function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, error } = useCourseHistoryDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton lines={2} />
        <Skeleton lines={4} />
        <Skeleton lines={3} />
      </div>
    );
  }

  if (error) {
    const is404 =
      error instanceof HttpError && (error as HttpError).status === 404;

    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-red-600">
          {is404
            ? "Session introuvable. Ce cours a peut-être été supprimé."
            : "Une erreur est survenue lors du chargement du cours."}
        </p>
      </Card>
    );
  }

  if (!data) return null;

  const date = new Date(data.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Bandeau contexte */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={data.mode === "file_question" ? "indigo" : "green"}>
            {data.mode === "file_question" ? "📄 Documents" : "🔍 Web"}
          </Badge>
          <span className="text-sm text-gray-500">{date}</span>
        </div>
        <div className="mt-2">
          <RichTextView markdown={data.question} className="text-sm text-gray-700" />
        </div>
        {data.filenames.length > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            Fichiers : {data.filenames.join(", ")}
          </p>
        )}
      </Card>

      <CourseView data={data.gemini_response} sessionId={data.id} />
    </div>
  );
}
