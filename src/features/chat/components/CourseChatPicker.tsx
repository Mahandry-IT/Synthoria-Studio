"use client";

import { useState } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/ErrorState";
import { Pagination } from "@/components/Pagination";
import { Skeleton } from "@/components/Skeleton";
import { useCourseHistory } from "@/features/history/hooks/useCourseHistory";
import { formatHistoryDate } from "@/features/history/history.utils";
import { markdownToPlain } from "@/shared/utils/markdown";

const PAGE_SIZE = 10;

/** Liste paginée des cours générés, pour choisir celui sur lequel discuter. */
export function CourseChatPicker({ onSelect }: { onSelect: (sessionId: string) => void }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useCourseHistory(page, PAGE_SIZE);

  if (isLoading) return <Skeleton lines={5} />;
  if (error) return <ErrorState error={error} />;
  if (!data || data.data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-gray-500">Aucun cours généré pour le moment : créez-en un pour pouvoir en discuter.</p>
      </Card>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {data.data.map((course) => (
          <li key={course.id}>
            <button
              type="button"
              onClick={() => onSelect(course.id)}
              className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-indigo-50 focus-visible:bg-indigo-50 focus-visible:outline-none"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-gray-900">{markdownToPlain(course.question)}</span>
                <span className="block text-xs text-gray-500">{formatHistoryDate(course.created_at)}</span>
              </span>
              <ChevronRightIcon className="shrink-0 text-gray-400" fontSize="small" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
    </div>
  );
}
