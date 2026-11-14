"use client";

import { useState } from "react";
import ChecklistIcon from "@mui/icons-material/Checklist";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ButtonLink } from "@/components/ButtonLink";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Pagination } from "@/components/Pagination";
import { SectionHeading } from "@/components/PageHeader";
import { useNow } from "@/shared/hooks/useNow";
import { markdownToPlain } from "@/shared/utils/markdown";
import { activePlans, formatCountdown, isExpiringSoon } from "../dashboard.logic";
import { useDeletePlan } from "../hooks/useDeletePlan";
import { usePendingPlans } from "../hooks/usePendingPlans";
import { useResumePlan } from "../hooks/useResumePlan";
import { DashboardCardSkeleton } from "./DashboardCardSkeleton";

/**
 * Plans en cours : proposés mais pas encore transformés en cours. Chaque plan affiche un compte
 * à rebours avant expiration et un bouton « Reprendre » qui rouvre la revue du plan dans /ask.
 */
export function PendingPlansList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [confirmingPlanId, setConfirmingPlanId] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = usePendingPlans(page, pageSize);
  const { resume } = useResumePlan();
  const deletePlanMutation = useDeletePlan();
  const now = useNow(30_000);

  if (isLoading) return <DashboardCardSkeleton label="plans en cours" />;
  if (error) {
    return (
      <section id="plans" className="scroll-mt-6">
        <SectionHeading title="Plans en cours" />
        <div className="mt-4">
          <ErrorState error={error} onRetry={() => refetch()} />
        </div>
      </section>
    );
  }

  // Un plan peut expirer entre deux rafraîchissements : on ne propose que les plans reprenables
  const plans = activePlans(data?.data ?? [], now);

  return (
    <section id="plans" className="scroll-mt-6">
      <SectionHeading
        title="Plans en cours"
        aside={data && data.meta.total > 0 ? <Badge variant="info">{data.meta.total}</Badge> : undefined}
      />

      {plans.length === 0 ? (
        <EmptyState className="mt-4"
          icon={<ChecklistIcon fontSize="small" />}
          title="Aucun plan en attente de validation."
          action={
            <ButtonLink href="/ask" variant="accent">
              Poser une question
            </ButtonLink>
          }
        />
      ) : (
        <ul>
          {plans.map((plan, index) => {
            const soon = isExpiringSoon(plan.expires_at, now);
            const name = plan.title || markdownToPlain(plan.question);

            return (
              <li key={plan.plan_id} className="flex flex-wrap items-start gap-x-4 gap-y-3 border-b border-line py-4">
                <span className="w-7 pt-1 font-mono text-xs text-ink-3" aria-hidden="true">
                  {String((page - 1) * pageSize + index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="line-clamp-2 font-serif text-lg leading-snug font-medium text-ink">
                    {plan.title || "Plan sans titre"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-2">{markdownToPlain(plan.question)}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">
                      {plan.sections_count} section{plan.sections_count > 1 ? "s" : ""}
                    </Badge>
                    <Badge variant={soon ? "warn" : "neutral"}>
                      <ScheduleIcon sx={{ fontSize: 14 }} aria-hidden="true" />
                      Expire dans {formatCountdown(plan.expires_at, now)}
                    </Badge>
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    aria-label={`Reprendre le plan ${name}`}
                    onClick={() => resume(plan.plan_id)}
                  >
                    Reprendre
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="danger"
                    aria-label={`Supprimer le plan ${name}`}
                    onClick={() => setConfirmingPlanId(plan.plan_id)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {confirmingPlanId && (
        <ConfirmDialog
          title="Supprimer ce plan ?"
          description="Ce plan sera définitivement supprimé."
          loading={deletePlanMutation.isPending}
          onConfirm={() =>
            deletePlanMutation.mutate(confirmingPlanId, { onSuccess: () => setConfirmingPlanId(null) })
          }
          onClose={() => setConfirmingPlanId(null)}
        />
      )}
    </section>
  );
}
