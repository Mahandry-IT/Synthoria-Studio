"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea";
import { Button } from "@/components/Button";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/shared/utils/constants";

interface ChatMessageEditorProps {
  /** Texte de départ : la question d'origine, ou la saisie conservée après un échec d'envoi. */
  initialText: string;
  original: string;
  /** Envoi ou suppression en cours, ou quota épuisé. */
  disabled: boolean;
  onCancel: () => void;
  onSave: (text: string) => void;
}

/**
 * Édition en ligne d'une question : Enregistrer crée une nouvelle version (1 message du quota).
 * Entrée enregistre, Maj+Entrée passe à la ligne, Échap annule (sans fermer le tiroir).
 */
export function ChatMessageEditor({ initialText, original, disabled, onCancel, onSave }: ChatMessageEditorProps) {
  const [text, setText] = useState(initialText);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const counterId = useId();

  const trimmed = text.trim();
  const isOverLimit = text.length > CHAT_MESSAGE_MAX_LENGTH;
  const canSave = !disabled && trimmed.length > 0 && !isOverLimit && trimmed !== original.trim();

  useEffect(() => {
    // AutoResizeTextarea garde sa propre ref : on retrouve le champ dans le conteneur
    const el = containerRef.current?.querySelector("textarea");
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const save = () => {
    if (canSave) onSave(text);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation(); // Échap annule l'édition sans fermer le tiroir du chat
      onCancel();
    } else if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      save();
    }
  };

  return (
    <div ref={containerRef} className="w-full rounded-2xl border border-indigo-200 bg-white p-2.5">
      <label htmlFor={inputId} className="sr-only">
        Modifier la question
      </label>
      <AutoResizeTextarea
        id={inputId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        maxLength={CHAT_MESSAGE_MAX_LENGTH}
        aria-describedby={counterId}
        className="max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span id={counterId} className={`text-xs ${isOverLimit ? "font-medium text-red-600" : "text-gray-500"}`}>
          {text.length} / {CHAT_MESSAGE_MAX_LENGTH}
        </span>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={!canSave}>
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}
