"use client";

import { memo, useEffect, useRef } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ReplayIcon from "@mui/icons-material/Replay";
import { Badge } from "@/components/Badge";
import { RichTextView } from "@/components/editor/RichTextView";
import { toSafeHttpUrl, type ChatThreadEntry } from "../chat.logic";
import type { ChatSource } from "../chat.types";
import { ChatMessageEditor } from "./ChatMessageEditor";
import { CopyMessageButton } from "./CopyMessageButton";

/** Actions sur les messages du fil (édition en versions, navigation, suppression, réessai). */
export interface ChatMessageActions {
  /** Envoi ou suppression en cours : toutes les actions sont désactivées. */
  busy: boolean;
  /** Éditer consomme un message du quota : impossible une fois le quota épuisé. */
  canEdit: boolean;
  onStartEdit: (entry: ChatThreadEntry) => void;
  onCancelEdit: () => void;
  onSaveEdit: (entry: ChatThreadEntry, text: string) => void;
  onNavigate: (entry: ChatThreadEntry, direction: -1 | 1) => void;
  onDelete: (entry: ChatThreadEntry) => void;
  /** Renvoie la question d'une réponse du tuteur (nouvelle version sœur ; consomme le quota). */
  onRetry: (entry: ChatThreadEntry) => void;
}

interface ChatMessageBubbleProps {
  entry: ChatThreadEntry;
  actions?: ChatMessageActions;
  /** Texte en cours d'édition si cette question est éditée, sinon `null`. */
  editText?: string | null;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const SOURCE_CARD = "flex items-center gap-2 rounded-ctrl border border-line bg-bg px-3 py-2";

/** Carte de source : icône livre, libellé, lien externe seulement pour une URL http(s) sûre. */
function SourceItem({ source }: { source: ChatSource }) {
  const href = toSafeHttpUrl(source.reference);
  const label = source.label || source.reference;
  return (
    <li>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${SOURCE_CARD} text-primary underline-offset-2 hover:underline`}
        >
          <MenuBookOutlinedIcon fontSize="inherit" className="shrink-0 text-base" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <OpenInNewIcon fontSize="inherit" className="shrink-0 text-sm" aria-hidden="true" />
        </a>
      ) : (
        <div className={`${SOURCE_CARD} text-ink-2`}>
          <MenuBookOutlinedIcon fontSize="inherit" className="shrink-0 text-base" aria-hidden="true" />
          <span className="min-w-0 flex-1 break-words">{label === source.reference ? label : `${label} — ${source.reference}`}</span>
        </div>
      )}
    </li>
  );
}

const BUBBLE_STYLES = {
  user: "on-primary rounded-[8px_8px_2px_8px] bg-primary text-primary-ink",
  answered: "mr-auto rounded-[8px_8px_8px_2px] border border-line bg-surface text-ink",
  off_topic: "mr-auto rounded-[8px_8px_8px_2px] border border-warn bg-warn-soft text-ink",
} as const;

const ICON_BUTTON =
  "flex h-9 w-9 items-center justify-center rounded-ctrl text-ink-2 transition-colors hover:bg-sunken hover:text-ink pointer-coarse:h-11 pointer-coarse:w-11 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent motion-reduce:transition-none";

/** Barre sous une question : navigation `< i/X >` entre versions (si X > 1), Copier, Modifier, Supprimer. */
function UserMessageToolbar({ entry, actions }: { entry: ChatThreadEntry; actions: ChatMessageActions }) {
  const versions = entry.versions;
  const { busy } = actions;

  return (
    <div className="flex items-center gap-0.5 text-xs text-ink-2">
      <CopyMessageButton markdown={entry.message.content} className={ICON_BUTTON} />
      {versions && versions.count > 1 && (
        <div className="flex items-center" role="group" aria-label="Versions de la question">
          <button
            type="button"
            className={ICON_BUTTON}
            aria-label="Version précédente"
            disabled={busy || !versions.previousId}
            onClick={() => actions.onNavigate(entry, -1)}
          >
            <ChevronLeftIcon fontSize="small" />
          </button>
          <span className="min-w-8 text-center font-mono tabular-nums" aria-hidden="true">
            {versions.index}/{versions.count}
          </span>
          <span className="sr-only">
            Version {versions.index} sur {versions.count}
          </span>
          <button
            type="button"
            className={ICON_BUTTON}
            aria-label="Version suivante"
            disabled={busy || !versions.nextId}
            onClick={() => actions.onNavigate(entry, 1)}
          >
            <ChevronRightIcon fontSize="small" />
          </button>
        </div>
      )}
      <button
        type="button"
        className={ICON_BUTTON}
        aria-label="Modifier la question"
        title={actions.canEdit ? "Modifier" : "Limite du jour atteinte"}
        disabled={busy || !actions.canEdit}
        onClick={() => actions.onStartEdit(entry)}
        data-edit-button
      >
        <EditOutlinedIcon fontSize="small" />
      </button>
      <button
        type="button"
        className={ICON_BUTTON}
        aria-label="Supprimer la question"
        title="Supprimer"
        disabled={busy}
        onClick={() => actions.onDelete(entry)}
      >
        <DeleteOutlineIcon fontSize="small" />
      </button>
    </div>
  );
}

/** Barre sous une réponse du tuteur : Copier, et Réessayer (même question, nouvelle version). */
function AssistantMessageToolbar({ entry, actions }: { entry: ChatThreadEntry; actions?: ChatMessageActions }) {
  return (
    <div className="flex items-center gap-0.5 text-xs text-ink-2">
      <CopyMessageButton markdown={entry.message.content} className={ICON_BUTTON} />
      {actions && (
        <button
          type="button"
          className={ICON_BUTTON}
          aria-label="Réessayer : reposer la même question"
          title={actions.canEdit ? "Réessayer (compte dans la limite du jour)" : "Limite du jour atteinte"}
          disabled={actions.busy || !actions.canEdit}
          onClick={() => actions.onRetry(entry)}
        >
          <ReplayIcon fontSize="small" />
        </button>
      )}
    </div>
  );
}

/**
 * Un message du chat : question de l'apprenant (aligné à droite, avec ses actions et ses versions)
 * ou réponse du tuteur (cartes de sources, badge « Hors sujet » si la question sortait du thème du cours).
 * Les deux sont rendus en Markdown avec formules LaTeX (`$...$`, `$$...$$`).
 */
function ChatMessageBubbleView({ entry, actions, editText = null }: ChatMessageBubbleProps) {
  const { message } = entry;
  const isUser = message.role === "user";
  const isEditing = isUser && editText !== null;
  const style = isUser ? BUBBLE_STYLES.user : BUBBLE_STYLES[message.status];
  const time = formatTime(message.created_at);
  const itemRef = useRef<HTMLLIElement>(null);
  const wasEditing = useRef(isEditing);

  // En sortie d'édition (Annuler), le focus revient sur le bouton Modifier
  useEffect(() => {
    if (wasEditing.current && !isEditing) {
      itemRef.current?.querySelector<HTMLButtonElement>("[data-edit-button]")?.focus();
    }
    wasEditing.current = isEditing;
  }, [isEditing]);

  if (isEditing && actions) {
    return (
      <li ref={itemRef} className="ml-auto w-full max-w-[95%]">
        <ChatMessageEditor
          initialText={editText}
          original={message.content}
          disabled={actions.busy || !actions.canEdit}
          onCancel={actions.onCancelEdit}
          onSave={(text) => actions.onSaveEdit(entry, text)}
        />
      </li>
    );
  }

  const bubble = (
    <div className={`px-3.5 py-2.5 text-sm ${style} ${isUser ? "" : "max-w-[85%]"}`}>
      <p className="sr-only">{isUser ? "Vous" : "Tuteur"}</p>
      {!isUser && message.status === "off_topic" && (
        <Badge variant="warn" className="mb-1.5">
          Hors sujet
        </Badge>
      )}
      <RichTextView markdown={message.content} className="break-words" />
      {!isUser && message.sources.length > 0 && (
        <div className="mt-3 border-t border-line pt-2.5 text-xs">
          <p className="kicker">Sources</p>
          <ul className="mt-1.5 space-y-1.5">
            {message.sources.map((source, i) => (
              <SourceItem key={`${source.reference}-${i}`} source={source} />
            ))}
          </ul>
        </div>
      )}
      {time && (
        <p className={`mt-1 text-right font-mono text-[11px] ${isUser ? "text-primary-ink" : "text-ink-3"}`}>
          <time dateTime={message.created_at}>{time}</time>
        </p>
      )}
    </div>
  );

  if (!isUser) {
    return (
      <li className="flex flex-col items-start gap-0.5">
        {bubble}
        <AssistantMessageToolbar entry={entry} actions={actions} />
      </li>
    );
  }

  return (
    <li ref={itemRef} className="ml-auto flex max-w-[85%] flex-col items-end gap-0.5">
      {bubble}
      {actions ? (
        <UserMessageToolbar entry={entry} actions={actions} />
      ) : (
        <CopyMessageButton markdown={message.content} className={ICON_BUTTON} />
      )}
    </li>
  );
}

export const ChatMessageBubble = memo(ChatMessageBubbleView);
