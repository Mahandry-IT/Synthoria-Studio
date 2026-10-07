"use client";

import { useMemo, useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { markdownToPlain } from "@/shared/utils/markdown";
import {
  isQuotaExhausted,
  lastAssistantId,
  resolveThread,
  ROOT_KEY,
  selectionAfterDelete,
  selectMessage,
  type ChatSelection,
  type ChatThreadEntry,
} from "../chat.logic";
import type { ChatMessage } from "../chat.types";
import { courseChatMutationKey, useCourseChat } from "../hooks/useCourseChat";
import { useDeleteChatMessage } from "../hooks/useDeleteChatMessage";
import { useSendChatMessage } from "../hooks/useSendChatMessage";
import { ChatComposer } from "./ChatComposer";
import { ChatHistory } from "./ChatHistory";
import type { ChatMessageActions } from "./ChatMessageBubble";

interface ChatConversationProps {
  /** Section en cours de lecture (facultatif), transmise pour cibler le contexte du tuteur. */
  sectionId?: string;
  /** Session persistée du cours : le serveur lit la leçon à partir de cet id. */
  sessionId: string;
  /** Classes du conteneur (sa hauteur est fixée par le parent : tiroir ou page). */
  className?: string;
}

const NO_MESSAGES: ChatMessage[] = [];

/**
 * Conversation avec le tuteur d'un cours : fil affiché (une version par niveau) groupé par jour
 * dans une zone défilante, champ de question en pied. Les questions s'éditent en nouvelles versions
 * (navigation `< i/X >`) et se suppriment avec leur suite. Réutilisée par le tiroir et la page /chat.
 */
export function ChatConversation({ sessionId, sectionId, className = "" }: ChatConversationProps) {
  const [draft, setDraft] = useState("");
  const [selection, setSelection] = useState<ChatSelection>({});
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [deleting, setDeleting] = useState<ChatMessage | null>(null);
  const [versionAnnouncement, setVersionAnnouncement] = useState("");

  const chat = useCourseChat(sessionId);
  const send = useSendChatMessage(sessionId);
  const { mutate: sendMessage } = send;
  const deleteMessage = useDeleteChatMessage(sessionId);
  const busy = useIsMutating({ mutationKey: courseChatMutationKey(sessionId) }) > 0;
  const quota = chat.data?.quota;

  const messages = chat.data?.messages ?? NO_MESSAGES;
  const thread = useMemo(() => resolveThread(messages, selection), [messages, selection]);

  // Pendant l'envoi d'une version éditée, le fil s'arrête avant la question éditée
  const editedId = send.isPending ? send.variables.editedId : undefined;
  const editedIndex = editedId ? thread.findIndex((entry) => entry.message.id === editedId) : -1;
  const shownThread = editedIndex >= 0 ? thread.slice(0, editedIndex) : thread;

  const handleSubmit = () => {
    sendMessage(
      { message: draft, sectionId, parentId: lastAssistantId(thread) },
      {
        onSuccess: (exchange) => {
          setDraft("");
          setSelection((current) => selectMessage(current, exchange.user_message));
        },
      },
    );
  };

  const actions = useMemo<ChatMessageActions>(
    () => ({
      busy,
      canEdit: !isQuotaExhausted(quota),
      onStartEdit: ({ message }: ChatThreadEntry) => setEditing({ id: message.id, text: message.content }),
      onCancelEdit: () => setEditing(null),
      onSaveEdit: ({ message, versions }: ChatThreadEntry, text: string) => {
        setEditing({ id: message.id, text }); // conservé si l'envoi échoue
        // Nouvelle version sœur : même parent que la question éditée (racine → null)
        const parentKey = versions?.parentKey ?? ROOT_KEY;
        sendMessage(
          { message: text, sectionId, parentId: parentKey === ROOT_KEY ? null : parentKey, editedId: message.id },
          {
            onSuccess: (exchange) => {
              setEditing(null);
              setSelection((current) => selectMessage(current, exchange.user_message));
            },
          },
        );
      },
      onNavigate: ({ versions }: ChatThreadEntry, direction: -1 | 1) => {
        const targetId = direction < 0 ? versions?.previousId : versions?.nextId;
        if (!versions || !targetId) return;
        setEditing(null);
        setSelection((current) => ({ ...current, [versions.parentKey]: targetId }));
        setVersionAnnouncement(`Version ${versions.index + direction} sur ${versions.count}`);
      },
      onDelete: ({ message }: ChatThreadEntry) => setDeleting(message),
    }),
    [busy, quota, sectionId, sendMessage],
  );

  const confirmDelete = () => {
    if (!deleting) return;
    const before = messages;
    const deletedId = deleting.id;
    deleteMessage.mutate(deletedId, {
      onSuccess: () => {
        setSelection((current) => selectionAfterDelete(before, current, deletedId));
        setEditing((current) => (current?.id === deletedId ? null : current));
      },
      onSettled: () => setDeleting(null),
    });
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
          <ChatHistory
            thread={shownThread}
            messageCount={messages.length}
            pendingMessage={send.isPending ? send.variables.message : null}
            actions={actions}
            editing={editing}
          />
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {send.isPending ? "Le tuteur rédige sa réponse…" : lastAnswer ? `Réponse du tuteur : ${markdownToPlain(lastAnswer)}` : ""}
      </p>
      <p className="sr-only" aria-live="polite">
        {versionAnnouncement}
      </p>

      {chat.data && (
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          quota={chat.data.quota}
          pending={busy}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Supprimer cette question ?"
          description="La question, la réponse du tuteur et toute la suite de cette version de la conversation seront supprimées. Les messages déjà utilisés aujourd'hui ne sont pas rendus."
          loading={deleteMessage.isPending}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
