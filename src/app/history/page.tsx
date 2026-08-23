"use client";

import { useState } from "react";
import { useCourseHistory } from "@/features/history/hooks/useCourseHistory";
import { HistoryTimeline } from "@/features/history/components/HistoryTimeline";
import { Pagination } from "@/components/Pagination";
import { Skeleton } from "@/components/Skeleton";
import { Card } from "@/components/Card";

const PAGE_SIZE = 10;

/**
 * Page d'historique des cours générés.
 */
export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCourseHistory(page, PAGE_SIZE);

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
            Aucun cours généré pour le moment.
          </p>
        </Card>
      )}

      {!isLoading && data && data.data.length > 0 && (
        <>
          <HistoryTimeline items={data.data} />
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
