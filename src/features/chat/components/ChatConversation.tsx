"use client";

import { useState } from "react";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { useCourseChat } from "../hooks/useCourseChat";
import { useSendChatMessage } from "../hooks/useSendChatMessage";
import { ChatComposer } from "./ChatComposer";
import { ChatHistory } from "./ChatHistory";

interface ChatConversationProps {
  /** Session persistée du cours : le serveur lit la leçon à partir de cet id. */
  sessionId: string;
  /** Classes du conteneur (sa hauteur est fixée par le parent : tiroir ou page). */
  className?: string;
}

/**
 * Conversation avec le tuteur d'un cours : historique groupé par jour (zone défilante) et champ de
 * question en pied. Réutilisée par le tiroir du cours et la page /chat.
 */
export function ChatConversation({ sessionId, className = "" }: ChatConversationProps) {
  const [draft, setDraft] = useState("");
  const chat = useCourseChat(sessionId);
  const send = useSendChatMessage(sessionId);

  const handleSubmit = () => {
    send.mutate(draft, { onSuccess: () => setDraft("") });
  };

  const lastAnswer = send.data?.assistant_message.content;

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {chat.isLoading && (
          <div className="space-y-3" aria-busy="true">
            <Skeleton lines={2} />
            <Skeleton lines={3} />
          </div>
        )}
        {chat.error && <ErrorState error={chat.error} onRetry={() => chat.refetch()} />}
        {chat.data && (
          <ChatHistory messages={chat.data.messages} pendingMessage={send.isPending ? send.variables : null} />
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {send.isPending ? "Le tuteur rédige sa réponse…" : lastAnswer ? `Réponse du tuteur : ${lastAnswer}` : ""}
      </p>

      {chat.data && (
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          quota={chat.data.quota}
          pending={send.isPending}
        />
      )}
    </div>
  );
}
