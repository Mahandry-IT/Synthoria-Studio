"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { useCourseHistoryDetail } from "@/features/history/hooks/useCourseHistoryDetail";
import { useDeleteCourse } from "@/features/history/hooks/useDeleteCourse";
import { CourseView } from "@/features/course/components/CourseView";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Skeleton } from "@/components/Skeleton";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/ErrorState";
import { Badge } from "@/components/Badge";
import { ScrollableQuestion } from "@/components/ScrollableQuestion";
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
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const { data, isLoading, error } = useCourseHistoryDetail(id);
  const deleteCourse = useDeleteCourse();

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
      <ErrorState
        error={
          new Error(
            is404
              ? "Session introuvable. Ce cours a peut-être été supprimé."
              : "Une erreur est survenue lors du chargement du cours.",
          )
        }
      />
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={data.mode === "file_question" ? "info" : "ok"}>
              {data.mode === "file_question" ? "📄 Documents" : "🔍 Web"}
            </Badge>
            <span className="font-mono text-xs text-ink-3">{date}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="danger"
            aria-label="Supprimer ce cours"
            onClick={() => setConfirming(true)}
          >
            <DeleteOutlineIcon fontSize="small" />
          </Button>
        </div>
        <ScrollableQuestion markdown={data.question} />
        {data.filenames.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Fichiers utilisés">
            <span className="text-xs text-ink-3">Fichiers :</span>
            {data.filenames.map((name) => (
              <Badge key={name} variant="neutral" className="max-w-full break-all" title={name}>
                {name}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <CourseView data={data.gemini_response} sessionId={data.id} />

      {confirming && (
        <ConfirmDialog
          title="Supprimer ce cours ?"
          description="Ce cours et son contenu associé (podcast, notes, révisions) seront définitivement supprimés."
          loading={deleteCourse.isPending}
          onConfirm={() => deleteCourse.mutate(data.id, { onSuccess: () => router.push("/history") })}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
