"use client";

import { useId, type FormEvent, type KeyboardEvent } from "react";
import SendIcon from "@mui/icons-material/Send";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/shared/utils/constants";
import { isQuotaExhausted, remainingLabel } from "../chat.logic";
import type { ChatQuota } from "../chat.types";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  quota: ChatQuota | null;
  pending: boolean;
}

function formatResetTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Champ de question du chat : grandit avec le texte, Entrée envoie (Maj+Entrée = retour à la ligne),
 * compteur de caractères et quota du jour ; désactivé si le message est vide/trop long ou le quota épuisé.
 */
export function ChatComposer({ value, onChange, onSubmit, quota, pending }: ChatComposerProps) {
  const inputId = useId();
  const helpId = useId();
  const exhausted = isQuotaExhausted(quota);
  const isEmpty = value.trim().length === 0;
  const isOverLimit = value.length > CHAT_MESSAGE_MAX_LENGTH;
  const canSend = !pending && !exhausted && !isEmpty && !isOverLimit;

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (canSend) onSubmit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
  };

  const resetTime = quota ? formatResetTime(quota.resets_at) : "";

  return (
    <form onSubmit={submit} className="border-t border-gray-200 bg-white p-3">
      <label htmlFor={inputId} className="sr-only">
        Votre question sur le cours
      </label>
      <div className="flex items-end gap-2">
        <AutoResizeTextarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={CHAT_MESSAGE_MAX_LENGTH}
          readOnly={pending}
          disabled={exhausted}
          placeholder={exhausted ? "Limite du jour atteinte" : "Posez une question sur le cours…"}
          aria-describedby={helpId}
          className="max-h-40 min-h-11 flex-1 overflow-y-auto rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 read-only:bg-gray-50"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Envoyer la question"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendIcon fontSize="small" />
        </button>
      </div>
      <p id={helpId} className="mt-1.5 flex flex-wrap justify-between gap-2 text-xs text-gray-500">
        <span className={exhausted ? "font-medium text-amber-700" : ""}>
          {exhausted
            ? `Limite de ${quota?.limit ?? ""} messages atteinte pour aujourd'hui${resetTime ? ` (nouveau quota à ${resetTime})` : ""}.`
            : quota
              ? remainingLabel(quota.remaining)
              : "Entrée pour envoyer, Maj+Entrée pour un retour à la ligne."}
        </span>
        <span className={isOverLimit ? "font-medium text-red-600" : ""}>
          {value.length} / {CHAT_MESSAGE_MAX_LENGTH}
        </span>
      </p>
    </form>
  );
}
