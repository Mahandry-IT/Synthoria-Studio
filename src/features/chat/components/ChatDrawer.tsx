"use client";

import { useEffect, useId, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";
import { ChatConversation } from "./ChatConversation";

interface ChatDrawerProps {
  sectionId?: string;
  sessionId: string;
  onClose: () => void;
}

/**
 * Panneau latéral du chat d'un cours : plein écran sur mobile, ~28 rem à droite dès `sm`.
 * Dialogue modal (focus piégé puis rendu au bouton d'ouverture), fermeture par Échap, voile ou bouton.
 */
export function ChatDrawer({ sessionId, sectionId, onClose }: ChatDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panelRef);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        id="course-chat-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-0 z-50 flex flex-col bg-white shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[28rem] sm:border-l sm:border-gray-200"
      >
        <header className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-gray-900">
              Chat du cours
            </h2>
            <p className="text-xs text-gray-500">Questions sur cette leçon uniquement.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le chat"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <CloseIcon />
          </button>
        </header>
        <ChatConversation sessionId={sessionId} sectionId={sectionId} className="flex-1" />
      </div>
    </>
  );
}
