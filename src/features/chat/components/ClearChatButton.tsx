"use client";

import { useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { courseChatMutationKey, useCourseChat } from "../hooks/useCourseChat";
import { useClearChat } from "../hooks/useClearChat";

interface ClearChatButtonProps {
  sessionId: string;
  /** Affiche le libellé à côté de l'icône (en-tête de page) ; icône seule dans le tiroir. */
  showLabel?: boolean;
}

/**
 * Supprime toute la conversation du cours après confirmation. Désactivé sans message
 * ou pendant un envoi / une suppression en cours.
 */
export function ClearChatButton({ sessionId, showLabel = false }: ClearChatButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const chat = useCourseChat(sessionId);
  const clear = useClearChat(sessionId);
  const busy = useIsMutating({ mutationKey: courseChatMutationKey(sessionId) }) > 0;
  const isEmpty = (chat.data?.messages.length ?? 0) === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={busy || isEmpty}
        aria-label={showLabel ? undefined : "Supprimer toute la conversation"}
        title="Supprimer toute la conversation"
        className={`flex h-11 items-center justify-center gap-1.5 rounded-ctrl text-ink-2 transition-colors hover:bg-err-soft hover:text-err motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-ink-2 ${showLabel ? "px-2.5 text-xs font-medium" : "w-11"}`}
      >
        <DeleteSweepOutlinedIcon fontSize="small" aria-hidden="true" />
        {showLabel && <span>Supprimer la conversation</span>}
      </button>
      {confirming && (
        <ConfirmDialog
          title="Supprimer toute la conversation ?"
          description="Toutes les questions, leurs versions et les réponses du tuteur pour ce cours seront supprimées. Les messages déjà utilisés aujourd'hui ne sont pas rendus."
          confirmLabel="Tout supprimer"
          loading={clear.isPending}
          onConfirm={() => clear.mutate(undefined, { onSettled: () => setConfirming(false) })}
          onClose={() => setConfirming(false)}
        />
      )}
    </>
  );
}
