"use client";

import { useState } from "react";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Pagination } from "@/components/Pagination";
import { useCourseHistory } from "@/features/history/hooks/useCourseHistory";
import { formatHistoryDate } from "@/features/history/history.utils";
import { markdownToPlain } from "@/shared/utils/markdown";

const PAGE_SIZE = 10;

/** Ligne fantôme à la forme d'une ligne de cours (titre + date). */
function CourseRowSkeleton() {
  return (
    <li className="min-h-14 border-b border-line px-3 py-3" aria-hidden="true">
      <div className="skel mb-2 h-4 w-4/5" />
      <div className="skel h-3 w-1/3" />
    </li>
  );
}

interface CourseChatPickerProps {
  onSelect: (sessionId: string) => void;
  /** Cours affiché dans la conversation : surligné (`aria-current`). */
  activeId?: string | null;
}

/** Liste paginée des cours générés (« Vos cours »), pour choisir celui sur lequel discuter. */
export function CourseChatPicker({ onSelect, activeId = null }: CourseChatPickerProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useCourseHistory(page, PAGE_SIZE);

  if (isLoading) {
    return (
      <ul aria-busy="true" className="border-t border-line">
        {Array.from({ length: 4 }).map((_, i) => (
          <CourseRowSkeleton key={i} />
        ))}
      </ul>
    );
  }
  if (error) return <ErrorState error={error} />;
  if (!data || data.data.length === 0) {
    return (
      <EmptyState
        icon={<ForumOutlinedIcon fontSize="small" />}
        title="Aucun cours généré pour le moment : créez-en un pour pouvoir en discuter."
      />
    );
  }

  return (
    <div>
      <ul className="border-t border-line">
        {data.data.map((course) => {
          const active = course.id === activeId;
          return (
            <li key={course.id} className="border-b border-line">
              <button
                type="button"
                onClick={() => onSelect(course.id)}
                aria-current={active ? "true" : undefined}
                className={`flex min-h-14 w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-sunken motion-reduce:transition-none ${active ? "bg-sunken" : ""}`}
              >
                <span className="min-w-0">
                  <span className={`block truncate text-ink ${active ? "font-semibold" : "font-medium"}`}>{markdownToPlain(course.question)}</span>
                  <span className="block font-mono text-xs text-ink-3">{formatHistoryDate(course.created_at)}</span>
                </span>
                <ForumOutlinedIcon className="shrink-0 text-ink-3" fontSize="small" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
    </div>
  );
}
