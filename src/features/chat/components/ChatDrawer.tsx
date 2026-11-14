"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@mui/icons-material/Close";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";
import { DRAWER_CLOSE_FALLBACK_MS } from "../chat.logic";
import { ChatConversation } from "./ChatConversation";
import { ClearChatButton } from "./ClearChatButton";

interface ChatDrawerProps {
  sectionId?: string;
  sessionId: string;
  onClose: () => void;
}

/**
 * Panneau latéral du chat d'un cours : plein écran (montée depuis le bas) sur mobile, 28 rem à droite
 * (glissement) dès `sm`. Ouverture 400 ms, sortie 220 ms ; sous `prefers-reduced-motion`, fondu de 120 ms.
 * Dialogue modal (focus piégé puis rendu au bouton d'ouverture), fermeture par Échap, voile ou bouton :
 * le panneau reste monté pendant la sortie (`data-state="closing"`), puis `onClose` le démonte.
 * Rendu dans un portail sur `document.body` : le voile couvre tout l'écran, quels que soient le
 * conteneur de défilement et les contextes d'empilement de la page qui l'ouvre.
 */
export function ChatDrawer({ sessionId, sectionId, onClose }: ChatDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [closing, setClosing] = useState(false);
  useFocusTrap(panelRef);

  // Démonte à la fin de la sortie (durées portées par le seul CSS) ; une seule fois
  const finishedRef = useRef(false);
  const finishClose = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimeout(timerRef.current);
    onClose();
  }, [onClose]);

  // Une seule fermeture : Échap, voile et bouton passent par ici ; les appels pendant la sortie sont ignorés
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    // Filet de sécurité si `animationend` ne part pas (animation absente) ; sinon `finishClose` s'en charge
    timerRef.current = setTimeout(finishClose, DRAWER_CLOSE_FALLBACK_MS);
  }, [finishClose]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Focus initial sur « Fermer » plutôt que sur le premier bouton (suppression de la conversation)
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Un dialogue ouvert dans le tiroir (confirmation de suppression) gère seul son Échap
      if (e.key !== "Escape" || panelRef.current?.querySelector('[role="dialog"]')) return;
      requestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [requestClose]);

  const state = closing ? "closing" : "open";

  return createPortal(
    <>
      <div
        className="chat-drawer-veil fixed inset-0 z-50 bg-veil"
        data-state={state}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        id="course-chat-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-state={state}
        onAnimationEnd={(e) => {
          if (closingRef.current && e.target === e.currentTarget) finishClose();
        }}
        className={`chat-drawer ${closing ? "pointer-events-none " : ""}fixed inset-0 z-50 flex flex-col bg-surface shadow-lift sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[28rem] sm:border-l sm:border-line`}
      >
        <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="kicker">Tuteur</p>
            <h2 id={titleId} className="font-serif text-lg font-medium text-ink">
              Chat du cours
            </h2>
            <p className="text-xs text-ink-2">Questions sur cette leçon uniquement.</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ClearChatButton sessionId={sessionId} />
            <button
              ref={closeRef}
              type="button"
              onClick={requestClose}
              aria-label="Fermer le chat"
              className="flex h-11 w-11 items-center justify-center rounded-ctrl text-ink-2 transition-colors hover:bg-sunken hover:text-ink motion-reduce:transition-none"
            >
              <CloseIcon />
            </button>
          </div>
        </header>
        <ChatConversation sessionId={sessionId} sectionId={sectionId} className="flex-1" />
      </div>
    </>,
    document.body,
  );
}
