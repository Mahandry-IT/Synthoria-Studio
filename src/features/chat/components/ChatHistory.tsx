"use client";

import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/Skeleton";
import { dayLabel, groupMessagesByDay, localDayKey } from "../chat.logic";
import type { ChatMessage } from "../chat.types";
import { ChatMessageBubble } from "./ChatMessageBubble";

interface ChatHistoryProps {
  messages: ChatMessage[];
  /** Question en cours d'envoi : affichée dans le jour courant, suivie d'un squelette de réponse. */
  pendingMessage?: string | null;
}

/** Bulle provisoire de la question envoyée et squelette de la réponse attendue. */
function PendingExchange({ text }: { text: string }) {
  return (
    <>
      <li className="ml-auto max-w-[85%] rounded-2xl bg-indigo-600/80 px-3.5 py-2.5 text-sm text-white">
        <p className="whitespace-pre-wrap break-words">{text}</p>
      </li>
      <li className="mr-auto w-3/4 rounded-2xl border border-gray-200 bg-white px-3.5 py-3" aria-hidden="true">
        <Skeleton lines={3} />
      </li>
    </>
  );
}

/**
 * Historique du chat regroupé par jour en accordéons (`<details>`) : le jour le plus récent en tête
 * et ouvert, les plus anciens repliés ; messages en ordre chronologique dans chaque jour.
 */
export function ChatHistory({ messages, pendingMessage }: ChatHistoryProps) {
  const endRef = useRef<HTMLLIElement>(null);
  const groups = groupMessagesByDay(messages);
  const todayKey = localDayKey(new Date());
  if (pendingMessage && groups[0]?.key !== todayKey) groups.unshift({ key: todayKey, messages: [] });

  // Garde le dernier échange visible (fin du jour le plus récent) à chaque nouveau message
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, pendingMessage]);

  if (groups.length === 0) {
    return (
      <p className="px-2 py-8 text-center text-sm text-gray-500">
        Posez une question sur ce cours : le tuteur répond à partir de la leçon.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((group, index) => (
        <details key={group.key} open={index === 0} className="group rounded-lg border border-gray-200 bg-gray-50/60">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 select-none transition-colors hover:bg-gray-100">
            <span className="first-letter:uppercase">{dayLabel(group.key)}</span>
            <svg
              className="h-4 w-4 text-gray-400 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </summary>
          <ul className="flex flex-col gap-2 border-t border-gray-100 px-3 pb-3 pt-2">
            {group.messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
            {index === 0 && pendingMessage && <PendingExchange text={pendingMessage} />}
            {index === 0 && <li ref={endRef} aria-hidden="true" className="h-0" />}
          </ul>
        </details>
      ))}
    </div>
  );
}
