"use client";

import { useCallback, useState } from "react";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { ChatDrawer } from "./ChatDrawer";

/**
 * Bouton flottant d'ouverture du chat d'un cours, placé juste au-dessus du bouton « remonter »
 * (`ScrollableMain`) et toujours visible ; ouvre le tiroir du chat.
 */
export function ChatLauncher({ sessionId, sectionId }: { sessionId: string; sectionId?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le chat du cours"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? "course-chat-drawer" : undefined}
        title="Chat du cours"
        className="fixed bottom-20 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-colors duration-200 hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        <ChatBubbleOutlineIcon fontSize="small" />
      </button>
      {open && <ChatDrawer sessionId={sessionId} sectionId={sectionId} onClose={close} />}
    </>
  );
}
