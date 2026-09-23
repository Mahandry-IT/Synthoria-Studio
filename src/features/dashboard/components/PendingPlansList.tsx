"use client";

import { useState } from "react";
import Link from "next/link";
import ChecklistIcon from "@mui/icons-material/Checklist";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/ErrorState";
import { Pagination } from "@/components/Pagination";
import { useNow } from "@/shared/hooks/useNow";
import { markdownToPlain } from "@/shared/utils/markdown";
import { activePlans, formatCountdown, isExpiringSoon } from "../dashboard.logic";
import { usePendingPlans } from "../hooks/usePendingPlans";
import { useResumePlan } from "../hooks/useResumePlan";
import { DashboardCardSkeleton } from "./DashboardCardSkeleton";

const PAGE_SIZE = 5;

/**
 * Plans en cours : proposés mais pas encore transformés en cours. Chaque plan affiche un compte
 * à rebours avant expiration et un bouton « Reprendre » qui rouvre la revue du plan dans /ask.
 */
export function PendingPlansList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = usePendingPlans(page, PAGE_SIZE);
  const resume = useResumePlan();
  const now = useNow(30_000);

  if (isLoading) return <DashboardCardSkeleton label="plans en cours" />;
  if (error) {
    return (
      <Card className="p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Plans en cours</h2>
        <ErrorState error={error} onRetry={() => refetch()} />
      </Card>
    );
  }

  // Un plan peut expirer entre deux rafraîchissements : on ne propose que les plans reprenables
  const plans = activePlans(data?.data ?? [], now);

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <ChecklistIcon fontSize="small" className="text-indigo-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-gray-900">Plans en cours</h2>
        {data && data.meta.total > 0 && <Badge variant="indigo">{data.meta.total}</Badge>}
      </div>

      {plans.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
          <p className="text-sm text-gray-600">Aucun plan en attente de validation.</p>
          <Link
            href="/ask"
            className="mt-3 inline-block text-sm font-medium text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
          >
            Poser une question
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {plans.map((plan) => {
            const soon = isExpiringSoon(plan.expires_at, now);
            const isResuming = resume.isPending && resume.variables === plan.plan_id;

            return (
              <li key={plan.plan_id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="line-clamp-1 text-sm font-medium text-gray-900">{plan.title || "Plan sans titre"}</p>
                  <p className="line-clamp-2 text-xs text-gray-500">{markdownToPlain(plan.question)}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <Badge variant="gray">
                      {plan.sections_count} section{plan.sections_count > 1 ? "s" : ""}
                    </Badge>
                    <span className={soon ? "font-medium text-amber-700" : "text-gray-500"}>
                      <span aria-hidden="true">{soon ? "⚠ " : "⏱ "}</span>
                      Expire dans {formatCountdown(plan.expires_at, now)}
                    </span>
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  loading={isResuming}
                  disabled={resume.isPending}
                  aria-label={`Reprendre le plan ${plan.title || markdownToPlain(plan.question)}`}
                  onClick={() => resume.mutate(plan.plan_id)}
                >
                  Reprendre
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination page={page} totalPages={data?.meta.totalPages ?? 1} onPageChange={setPage} />
    </Card>
  );
}
