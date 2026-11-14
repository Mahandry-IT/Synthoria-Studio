"use client";

import { useState } from "react";
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useCourseHistory } from "@/features/history/hooks/useCourseHistory";
import { useDeleteCourse } from "@/features/history/hooks/useDeleteCourse";
import { useCourseFolders } from "@/features/history/hooks/useCourseFolders";
import { useMoveCourseToFolder } from "@/features/history/hooks/useMoveCourseToFolder";
import { useDeleteFolder } from "@/features/history/hooks/useDeleteFolder";
import { useDeleteSubfolder } from "@/features/history/hooks/useDeleteSubfolder";
import { HistoryTimeline } from "@/features/history/components/HistoryTimeline";
import { FolderNav } from "@/components/folders/FolderNav";
import { MoveToFolderDialog } from "@/components/folders/MoveToFolderDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Pagination } from "@/components/Pagination";
import { Skeleton } from "@/components/Skeleton";
import { ButtonLink } from "@/components/ButtonLink";
import { CollapsibleFolderPanel } from "@/components/folders/CollapsibleFolderPanel";
import { filterLabel } from "@/components/folders/folders.utils";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { countLabel } from "@/shared/utils/plural";
import type { DragData, DropTarget } from "@/components/folders/folders.dnd";
import { innermostPointerWithin, resolveDropMove } from "@/components/folders/folders.dnd";
import { useFolderDndSensors } from "@/components/folders/useFolderDndSensors";
import { markdownToPlain } from "@/shared/utils/markdown";
import type { CourseFolderFilter, CourseHistoryItem } from "@/features/history/history.types";


/**
 * Page d'historique des cours générés, organisés en dossiers/sous-dossiers (rangement virtuel :
 * un attribut sur chaque cours côté API, pas une hiérarchie physique).
 */
export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState<CourseFolderFilter | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [movingItem, setMovingItem] = useState<CourseHistoryItem | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);
  const [deletingSubfolder, setDeletingSubfolder] = useState<{ folder: string; subfolder: string } | null>(null);
  const [draggedItem, setDraggedItem] = useState<CourseHistoryItem | null>(null);

  const { data, isLoading, error, refetch } = useCourseHistory(page, pageSize, filter ?? undefined);
  const { data: folders, isLoading: foldersLoading } = useCourseFolders();
  const deleteCourse = useDeleteCourse();
  const moveCourse = useMoveCourseToFolder();
  const deleteFolder = useDeleteFolder();
  const deleteSubfolder = useDeleteSubfolder();

  const sensors = useFolderDndSensors();

  function handleSelect(next: CourseFolderFilter | null) {
    setFilter(next);
    setPage(1);
  }

  function handleDragStart(event: DragStartEvent) {
    setDraggedItem((event.active.data.current as DragData<CourseHistoryItem> | undefined)?.item ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggedItem(null);
    const { active, over } = event;
    if (!over) return; // déposé hors du panneau de dossiers : glisser annulé, aucun effet

    const move = resolveDropMove(
      active.data.current as DragData<CourseHistoryItem> | undefined,
      over.data.current as DropTarget | undefined,
    );
    if (move) moveCourse.mutate({ sessionId: move.item.id, ...move.placement });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker={data ? countLabel(data.meta.total, "cours", "cours") : undefined}
        title="Historique des cours"
        description="Retrouvez tous les cours que vous avez générés."
      />

      <DndContext
        sensors={sensors}
        collisionDetection={innermostPointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="h-fit">
            <p className="kicker mb-2 hidden lg:block">Dossiers</p>
            <CollapsibleFolderPanel currentLabel={filterLabel(filter, "Tous les cours")}>
              <FolderNav
                folders={folders}
                isLoading={foldersLoading}
                allLabel="Tous les cours"
                ariaLabel="Dossiers de cours"
                collapsedStorageKey="history-collapsed-folders"
                filter={filter}
                onSelect={handleSelect}
                onDeleteFolder={setDeletingFolder}
                onDeleteSubfolder={(folder, subfolder) => setDeletingSubfolder({ folder, subfolder })}
              />
            </CollapsibleFolderPanel>
          </div>

          <div className="min-w-0 space-y-6">
            {isLoading && (
              <div aria-busy="true" role="status" aria-label="Chargement de l'historique">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="border-b border-line px-2 py-4">
                    <Skeleton lines={2} aria-hidden="true" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && error && <ErrorState error={error} onRetry={refetch} />}

            {!isLoading && !error && data && data.data.length === 0 && (
              <EmptyState
                title={filter ? "Aucun cours dans ce dossier." : "Aucun cours généré pour le moment."}
                action={
                  filter ? undefined : (
                    <ButtonLink href="/ask" variant="accent">
                      Poser une question
                    </ButtonLink>
                  )
                }
              />
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
                  pageSize={pageSize}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              </>
            )}
          </div>
        </div>

        <DragOverlay>
          {draggedItem && (
            <div className="max-w-xs truncate rounded-card border border-line-strong bg-surface px-3 py-2 text-sm text-ink shadow-lift">
              {markdownToPlain(draggedItem.question)}
            </div>
          )}
        </DragOverlay>
      </DndContext>

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
        <MoveToFolderDialog
          title="Déplacer ce cours"
          current={movingItem}
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
