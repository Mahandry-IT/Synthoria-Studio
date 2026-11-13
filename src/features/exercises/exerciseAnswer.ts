/** Limite de longueur de la réponse, alignée sur le serveur. */
export const EXERCISE_ANSWER_MAX_LENGTH = 4000;

export interface AnswerCheck {
  tooLong: boolean;
  canSubmit: boolean;
}

/** Envoi possible : réponse non vide, dans la limite, aucun envoi en cours (un seul à la fois). */
export function checkAnswer(answer: string, pending: boolean): AnswerCheck {
  const tooLong = answer.length > EXERCISE_ANSWER_MAX_LENGTH;
  return { tooLong, canSubmit: !pending && !tooLong && answer.trim().length > 0 };
}

const DRAFT_PREFIX = "synthoria.exercise.draft.";

export const draftKey = (sessionId: string, exerciseId: string) => `${DRAFT_PREFIX}${sessionId}.${exerciseId}`;

/** Brouillon enregistré ; stockage indisponible ou vide : chaîne vide. */
export function readDraft(sessionId: string, exerciseId: string, storage?: Pick<Storage, "getItem">): string {
  try {
    return (storage ?? window.localStorage).getItem(draftKey(sessionId, exerciseId)) ?? "";
  } catch {
    return "";
  }
}

/** Enregistre le brouillon ; une réponse vide l'efface. Stockage indisponible : ignoré. */
export function writeDraft(
  sessionId: string,
  exerciseId: string,
  answer: string,
  storage?: Pick<Storage, "setItem" | "removeItem">,
): void {
  try {
    const target = storage ?? window.localStorage;
    if (answer.length === 0) target.removeItem(draftKey(sessionId, exerciseId));
    else target.setItem(draftKey(sessionId, exerciseId), answer);
  } catch {
    // Navigation privée ou quota : le brouillon n'est simplement pas gardé.
  }
}

export function clearDraft(sessionId: string, exerciseId: string, storage?: Pick<Storage, "removeItem">): void {
  try {
    (storage ?? window.localStorage).removeItem(draftKey(sessionId, exerciseId));
  } catch {
    // Rien à effacer si le stockage est indisponible.
  }
}

export const DRAFT_DEBOUNCE_MS = 300;

export interface DraftWriter {
  /** Planifie l'écriture (la dernière valeur gagne). */
  write: (answer: string) => void;
  /** Écrit tout de suite la valeur en attente (envoi, démontage). */
  flush: () => void;
}

/** Écriture du brouillon retardée de ~300 ms : pas d'écriture en stockage à chaque frappe. */
export function createDraftWriter(
  sessionId: string,
  exerciseId: string,
  delayMs: number = DRAFT_DEBOUNCE_MS,
  storage?: Pick<Storage, "setItem" | "removeItem">,
): DraftWriter {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: string | null = null;

  function flush() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    if (pending === null) return;
    const value = pending;
    pending = null;
    writeDraft(sessionId, exerciseId, value, storage);
  }

  return {
    write(answer) {
      pending = answer;
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    flush,
  };
}
