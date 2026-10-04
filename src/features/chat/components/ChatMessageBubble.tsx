"use client";

import { Badge } from "@/components/Badge";
import { RichText } from "@/features/course/components/RichText";
import { toSafeHttpUrl } from "../chat.logic";
import type { ChatMessage, ChatSource } from "../chat.types";

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function SourceItem({ source }: { source: ChatSource }) {
  const href = toSafeHttpUrl(source.reference);
  const label = source.label || source.reference;
  return (
    <li className="truncate">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          {label}
        </a>
      ) : (
        <span>{label === source.reference ? label : `${label} — ${source.reference}`}</span>
      )}
    </li>
  );
}

const BUBBLE_STYLES = {
  user: "ml-auto bg-indigo-600 text-white",
  answered: "mr-auto border border-gray-200 bg-white text-gray-900",
  off_topic: "mr-auto border border-amber-200 bg-amber-50 text-amber-900",
} as const;

/**
 * Un message du chat : question de l'apprenant (texte brut, aligné à droite) ou réponse du tuteur
 * (rendu riche, sources, badge « Hors sujet » si la question sortait du thème du cours).
 */
export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const style = isUser ? BUBBLE_STYLES.user : BUBBLE_STYLES[message.status];
  const time = formatTime(message.created_at);

  return (
    <li className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${style}`}>
      <p className="sr-only">{isUser ? "Vous" : "Tuteur"}</p>
      {!isUser && message.status === "off_topic" && (
        <Badge variant="amber" className="mb-1.5">
          Hors sujet
        </Badge>
      )}
      {isUser ? (
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      ) : (
        <RichText text={message.content} className="break-words" />
      )}
      {!isUser && message.sources.length > 0 && (
        <div className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-600">
          <p className="font-medium">Sources</p>
          <ul className="mt-0.5 space-y-0.5">
            {message.sources.map((source, i) => (
              <SourceItem key={`${source.reference}-${i}`} source={source} />
            ))}
          </ul>
        </div>
      )}
      {time && (
        <p className={`mt-1 text-right text-[11px] ${isUser ? "text-indigo-100" : "text-gray-400"}`}>
          <time dateTime={message.created_at}>{time}</time>
        </p>
      )}
    </li>
  );
}
