"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { ChatConversation } from "@/features/chat/components/ChatConversation";
import { ClearChatButton } from "@/features/chat/components/ClearChatButton";
import { CourseChatPicker } from "@/features/chat/components/CourseChatPicker";
import { useCourseHistoryDetail } from "@/features/history/hooks/useCourseHistoryDetail";
import { markdownToPlain } from "@/shared/utils/markdown";

/** En-tête du cours sélectionné : titre (question d'origine) et actions. */
function SelectedCourseHeader({ sessionId, onChange }: { sessionId: string; onChange: () => void }) {
  const { data } = useCourseHistoryDetail(sessionId);
  const title = data ? markdownToPlain(data.question) : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">Cours sélectionné</p>
        {title ? (
          <p className="truncate font-semibold text-gray-900">{title}</p>
        ) : (
          <Skeleton lines={1} className="w-48" />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onChange}>
          Changer de cours
        </Button>
        <Link
          href={`/history/${encodeURIComponent(sessionId)}`}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          Voir le cours
        </Link>
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

  if (!sessionId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Choisissez d&apos;abord un cours : le tuteur ne répond qu&apos;aux questions sur sa leçon.</p>
        <CourseChatPicker onSelect={selectCourse} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SelectedCourseHeader sessionId={sessionId} onChange={clearCourse} />
      <Card className="overflow-hidden">
        <ChatConversation key={sessionId} sessionId={sessionId} className="h-[calc(100dvh-16rem)] min-h-[24rem]" />
      </Card>
    </div>
  );
}

/**
 * Page « Chat » : choix d'un cours (mémorisé dans l'URL `?course=<id>`), puis conversation avec le
 * tuteur de ce cours. Sans cours choisi, aucun champ de question n'est affiché.
 */
export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <p className="mt-1 text-sm text-gray-500">Posez vos questions sur un cours déjà généré.</p>
      </div>
      <Suspense fallback={<Skeleton lines={4} />}>
        <ChatPageContent />
      </Suspense>
    </div>
  );
}
