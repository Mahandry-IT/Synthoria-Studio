"use client";

import { useCallback, useState } from "react";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { Button } from "@/components/Button";
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
      <Button
        type="button"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le chat du cours"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? "course-chat-drawer" : undefined}
        title="Chat du cours"
        className="fixed bottom-20 right-6 z-40 shadow-lift"
      >
        <ChatBubbleOutlineIcon fontSize="small" />
      </Button>
      {open && <ChatDrawer sessionId={sessionId} sectionId={sectionId} onClose={close} />}
    </>
  );
}
