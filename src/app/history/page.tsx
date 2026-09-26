"use client";

import { useState } from "react";
import { useCourseHistory } from "@/features/history/hooks/useCourseHistory";
import { useDeleteCourse } from "@/features/history/hooks/useDeleteCourse";
import { useCourseFolders } from "@/features/history/hooks/useCourseFolders";
import { useMoveCourseToFolder } from "@/features/history/hooks/useMoveCourseToFolder";
import { useDeleteFolder } from "@/features/history/hooks/useDeleteFolder";
import { useDeleteSubfolder } from "@/features/history/hooks/useDeleteSubfolder";
import { HistoryTimeline } from "@/features/history/components/HistoryTimeline";
import { FolderNav } from "@/features/history/components/FolderNav";
import { MoveCourseDialog } from "@/features/history/components/MoveCourseDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Pagination } from "@/components/Pagination";
import { Skeleton } from "@/components/Skeleton";
import { Card } from "@/components/Card";
import type { CourseFolderFilter, CourseHistoryItem } from "@/features/history/history.types";

const PAGE_SIZE = 10;

/**
 * Page d'historique des cours générés, organisés en dossiers/sous-dossiers (rangement virtuel :
 * un attribut sur chaque cours côté API, pas une hiérarchie physique).
 */
export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<CourseFolderFilter | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [movingItem, setMovingItem] = useState<CourseHistoryItem | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);
  const [deletingSubfolder, setDeletingSubfolder] = useState<{ folder: string; subfolder: string } | null>(null);

  const { data, isLoading } = useCourseHistory(page, PAGE_SIZE, filter ?? undefined);
  const { data: folders } = useCourseFolders();
  const deleteCourse = useDeleteCourse();
  const moveCourse = useMoveCourseToFolder();
  const deleteFolder = useDeleteFolder();
  const deleteSubfolder = useDeleteSubfolder();

  function handleSelect(next: CourseFolderFilter | null) {
    setFilter(next);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Historique des cours
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Retrouvez tous les cours que vous avez générés.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit p-3">
          <FolderNav
            filter={filter}
            onSelect={handleSelect}
            onDeleteFolder={setDeletingFolder}
            onDeleteSubfolder={(folder, subfolder) => setDeletingSubfolder({ folder, subfolder })}
          />
        </Card>

        <div className="min-w-0 space-y-6">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton lines={2} />
              <Skeleton lines={4} />
              <Skeleton lines={3} />
            </div>
          )}

          {!isLoading && data && data.data.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-sm text-gray-500">
                {filter ? "Aucun cours dans ce dossier." : "Aucun cours généré pour le moment."}
              </p>
            </Card>
          )}

          {!isLoading && data && data.data.length > 0 && (
            <>
              <HistoryTimeline
                items={data.data}
                onDeleteClick={setConfirmingId}
                onMoveClick={setMovingItem}
                showFolder={filter === null}
              />
              <Pagination
                page={data.meta.page}
                totalPages={data.meta.totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      {confirmingId && (
        <ConfirmDialog
          title="Supprimer ce cours ?"
          description="Ce cours et son contenu associé (podcast, notes, révisions) seront définitivement supprimés."
          loading={deleteCourse.isPending}
          onConfirm={() => deleteCourse.mutate(confirmingId, { onSuccess: () => setConfirmingId(null) })}
          onClose={() => setConfirmingId(null)}
        />
      )}

      {movingItem && (
        <MoveCourseDialog
          item={movingItem}
          folders={folders}
          loading={moveCourse.isPending}
          onConfirm={(folder, subfolder) =>
            moveCourse.mutate(
              { sessionId: movingItem.id, folder, subfolder },
              { onSuccess: () => setMovingItem(null) },
            )
          }
          onClose={() => setMovingItem(null)}
        />
      )}

      {deletingFolder && (
        <ConfirmDialog
          title={`Supprimer le dossier « ${deletingFolder} » ?`}
          description="Les cours qu'il contient (et ceux de ses sous-dossiers) rejoindront le dossier « Général ». Aucun cours n'est supprimé."
          loading={deleteFolder.isPending}
          onConfirm={() =>
            deleteFolder.mutate(deletingFolder, {
              onSuccess: () => {
                if (filter?.folder === deletingFolder) handleSelect(null);
                setDeletingFolder(null);
              },
            })
          }
          onClose={() => setDeletingFolder(null)}
        />
      )}

      {deletingSubfolder && (
        <ConfirmDialog
          title={`Supprimer le sous-dossier « ${deletingSubfolder.subfolder} » ?`}
          description={`Les cours qu'il contient rejoindront « Non classé » dans « ${deletingSubfolder.folder} ». Aucun cours n'est supprimé.`}
          loading={deleteSubfolder.isPending}
          onConfirm={() =>
            deleteSubfolder.mutate(deletingSubfolder, {
              onSuccess: () => {
                if (filter?.folder === deletingSubfolder.folder && filter.subfolder === deletingSubfolder.subfolder) {
                  handleSelect({ folder: deletingSubfolder.folder });
                }
                setDeletingSubfolder(null);
              },
            })
          }
          onClose={() => setDeletingSubfolder(null)}
        />
      )}
    </div>
  );
}
