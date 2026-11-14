"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/Badge";
import { ButtonLink } from "@/components/ButtonLink";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader, SectionHeading } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { isQuotaExhausted, remainingLabel } from "@/features/chat/chat.logic";
import { ChatConversation } from "@/features/chat/components/ChatConversation";
import { ClearChatButton } from "@/features/chat/components/ClearChatButton";
import { CourseChatPicker } from "@/features/chat/components/CourseChatPicker";
import { useCourseChat } from "@/features/chat/hooks/useCourseChat";
import { useCourseHistoryDetail } from "@/features/history/hooks/useCourseHistoryDetail";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { markdownToPlain } from "@/shared/utils/markdown";

const COURSES_HEADING_ID = "chat-courses-heading";

/** En-tête du cours sélectionné : titre (question d'origine), quota du jour et actions. */
function SelectedCourseHeader({ sessionId, onChange }: { sessionId: string; onChange: () => void }) {
  const { data } = useCourseHistoryDetail(sessionId);
  const quota = useCourseChat(sessionId).data?.quota;
  const title = data ? markdownToPlain(data.question) : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="kicker">Cours sélectionné</p>
        {title ? (
          <p className="mt-1 truncate font-serif text-xl font-medium text-ink">{title}</p>
        ) : (
          <Skeleton lines={1} className="mt-2 w-48" />
        )}
        {quota && (
          <Badge variant={isQuotaExhausted(quota) ? "warn" : "neutral"} className="mt-2">
            {remainingLabel(quota.remaining)}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onChange}>
          Changer de cours
        </Button>
        <ButtonLink href={`/history/${encodeURIComponent(sessionId)}`} variant="ghost" size="sm">
          Voir le cours
        </ButtonLink>
        <ClearChatButton sessionId={sessionId} showLabel />
      </div>
    </div>
  );
}

function ChatPageContent() {
  const router = useRouter();
  const sessionId = useSearchParams().get("course");

  const selectCourse = (id: string) => router.replace(`/chat?course=${encodeURIComponent(id)}`);
  const clearCourse = () => router.replace("/chat");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Une seule liste « Vos cours » : en colonne de droite dès `lg`, et seule étape visible sur mobile
  // tant qu'aucun cours n'est choisi (ensuite le bouton « Changer de cours » y ramène).
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-10">
      <div className="min-w-0 space-y-4">
        {sessionId ? (
          <>
            <SelectedCourseHeader sessionId={sessionId} onChange={clearCourse} />
            <Card className="overflow-hidden">
              <ChatConversation
                key={sessionId}
                sessionId={sessionId}
                className="h-[calc(100dvh-26rem)] min-h-[26rem] lg:h-[calc(100dvh-23rem)]"
              />
            </Card>
          </>
        ) : (
          <p className="text-sm text-ink-2">Choisissez d&apos;abord un cours : le tuteur ne répond qu&apos;aux questions sur sa leçon.</p>
        )}
      </div>
      <aside aria-labelledby={COURSES_HEADING_ID} className={sessionId ? "hidden min-w-0 lg:block" : "min-w-0"}>
        <SectionHeading id={COURSES_HEADING_ID} title="Vos cours" />
        {/* masquée sur mobile une fois un cours choisi : inutile de la monter (ni de charger l'historique) */}
        {(!sessionId || isDesktop) && <CourseChatPicker onSelect={selectCourse} activeId={sessionId} />}
      </aside>
    </div>
  );
}

/**
 * Page « Chat » : choix d'un cours (mémorisé dans l'URL `?course=<id>`), puis conversation avec le
 * tuteur de ce cours. Sans cours choisi, aucun champ de question n'est affiché.
 */
export default function ChatPage() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="Tuteur" title="Chat" description="Posez vos questions sur un cours déjà généré." />
      <Suspense fallback={<Skeleton lines={4} />}>
        <ChatPageContent />
      </Suspense>
    </div>
  );
}
