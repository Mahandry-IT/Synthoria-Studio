"use client";

import { useId, type FormEvent, type KeyboardEvent } from "react";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SendIcon from "@mui/icons-material/Send";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea";
import { Button } from "@/components/Button";
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
 * compteur de caractères et quota du jour ; désactivé si le message est vide/trop long ou le quota épuisé
 * (un encart d'avertissement explique alors la limite et l'heure de remise à zéro).
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
    <form onSubmit={submit} className="border-t border-line bg-surface p-3">
      {exhausted && (
        <div id={helpId} role="status" className="mb-2 flex items-start gap-2 rounded-ctrl bg-warn-soft px-3 py-2 text-xs font-medium text-warn">
          <HourglassEmptyIcon fontSize="inherit" className="mt-px shrink-0 text-sm" aria-hidden="true" />
          <span>
            {`Limite de ${quota?.limit ?? ""} messages atteinte pour aujourd'hui${resetTime ? ` (nouveau quota à ${resetTime})` : ""}.`}
          </span>
        </div>
      )}
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
          className="max-h-40 min-h-11 flex-1 overflow-y-auto rounded-ctrl border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 disabled:cursor-not-allowed disabled:bg-sunken read-only:bg-sunken"
        />
        <Button type="submit" variant="accent" size="icon" disabled={!canSend} aria-label="Envoyer la question">
          <SendIcon fontSize="small" />
        </Button>
      </div>
      <p id={exhausted ? undefined : helpId} className="mt-1.5 flex flex-wrap justify-between gap-2 text-xs text-ink-2">
        <span>
          {exhausted
            ? ""
            : quota
              ? remainingLabel(quota.remaining)
              : "Entrée pour envoyer, Maj+Entrée pour un retour à la ligne."}
        </span>
        <span className={`font-mono ${isOverLimit ? "font-medium text-err" : ""}`}>
          {value.length} / {CHAT_MESSAGE_MAX_LENGTH}
        </span>
      </p>
    </form>
  );
}
