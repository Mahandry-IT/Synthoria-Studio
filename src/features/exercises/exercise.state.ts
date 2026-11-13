import { describeError } from "@/shared/api/errors";
import type { ExerciseStatus } from "./exercise.types";

export const EXERCISES_POLL_INTERVAL_MS = 2_500;

/** Statuts pour lesquels la génération est en cours. */
export function isGenerating(status: ExerciseStatus | undefined): boolean {
  return status === "pending" || status === "generating";
}

/** Nombre d'échecs de lecture consécutifs au-delà duquel le polling s'arrête. */
export const EXERCISES_POLL_MAX_ERRORS = 3;

/**
 * Intervalle de polling : actif seulement tant que la génération est en cours
 * (arrêt sur done/failed/absent, et après trop d'échecs de lecture consécutifs).
 */
export function exercisesPollIntervalMs(status: ExerciseStatus | undefined, errorCount = 0): number | false {
  if (errorCount >= EXERCISES_POLL_MAX_ERRORS) return false;
  return isGenerating(status) ? EXERCISES_POLL_INTERVAL_MS : false;
}

/** Un cours généré depuis moins de ce délai est « frais » : la question des exercices peut être posée. */
export const EXERCISES_OFFER_MAX_AGE_MS = 60 * 60 * 1000;

/** Cours fraîchement généré ? Date absente ou illisible : non (on ne propose pas sur l'historique). */
export function isFreshCourse(generatedAt: string | undefined, now: number): boolean {
  if (!generatedAt) return false;
  const time = Date.parse(generatedAt);
  if (Number.isNaN(time)) return false;
  const age = now - time;
  return age >= -5 * 60 * 1000 && age <= EXERCISES_OFFER_MAX_AGE_MS; // tolère un léger décalage d'horloge
}

/** Messages des erreurs de lancement, propres au contexte (repli quand le backend ne fournit pas de `detail`). */
export const EXERCISES_ERROR_MESSAGES = {
  409: "Les exercices ne peuvent pas être générés pour ce cours.",
  429: "Trop de demandes de génération. Patientez un peu avant de réessayer.",
} as const;

/**
 * Message d'une erreur de lancement. Un 409 se lit dans le `detail` du backend :
 * quiz absent (ne passera jamais) ou cours pas terminé (section incomplète, à relancer plus tard).
 */
export function exercisesLaunchErrorMessage(err: unknown): string {
  const info = describeError(err, EXERCISES_ERROR_MESSAGES);
  if (info.status !== 409) return info.message;
  const detail = info.message.toLowerCase();
  if (detail.includes("quiz")) return "Ce cours n'a pas de quiz terminé : les exercices ne peuvent pas être générés.";
  if (detail.includes("cours")) {
    return "Le cours n'est pas terminé (une section est incomplète) : relancez les exercices une fois le cours complet.";
  }
  return EXERCISES_ERROR_MESSAGES[409];
}

/**
 * Réponse « Oui » à la question : lance la génération, puis appelle `onLaunched` seulement en cas de succès.
 * Sur échec (409, 429, réseau), rien n'est mémorisé : la fenêtre peut revenir. L'erreur est déjà signalée
 * par l'appelant (toast), elle n'est pas relancée.
 */
export async function acceptExercisesOffer(generate: () => Promise<unknown>, onLaunched: () => void): Promise<boolean> {
  try {
    await generate();
  } catch {
    return false;
  }
  onLaunched();
  return true;
}

const ASKED_KEY_PREFIX = "synthoria.exercises.asked.";

/** La question « Générer les exercices ? » a-t-elle déjà été posée pour ce cours ? Stockage indisponible : non. */
export function wasExercisesPromptAsked(sessionId: string, storage?: Pick<Storage, "getItem">): boolean {
  try {
    return (storage ?? window.localStorage).getItem(ASKED_KEY_PREFIX + sessionId) === "1";
  } catch {
    return false;
  }
}

/** Mémorise que la question a été posée (une seule fois par cours), quelle que soit la réponse. */
export function markExercisesPromptAsked(sessionId: string, storage?: Pick<Storage, "setItem">): void {
  try {
    (storage ?? window.localStorage).setItem(ASKED_KEY_PREFIX + sessionId, "1");
  } catch {
    // Stockage indisponible (navigation privée) : la question pourra être reposée, sans conséquence.
  }
}
