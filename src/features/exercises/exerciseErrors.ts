import { describeError } from "@/shared/api/errors";

const KEPT = "Votre réponse est conservée.";

/** Messages de la correction ; chacun rassure : la réponse n'est pas perdue. */
export const ANSWER_ERROR_MESSAGES = {
  429: `Trop de corrections demandées ou quota atteint : patientez un instant avant de renvoyer. ${KEPT}`,
  502: `Le moteur IA a renvoyé une réponse invalide. Réessayez dans un instant. ${KEPT}`,
  503: `Le moteur IA est momentanément indisponible. Réessayez dans un instant. ${KEPT}`,
} as const;

/** Message d'échec de la correction : toujours suivi de « votre réponse est conservée » (le brouillon est gardé). */
export function answerErrorMessage(err: unknown): string {
  const message = describeError(err, ANSWER_ERROR_MESSAGES).message;
  return message.toLowerCase().includes("réponse est conservée") ? message : `${message} ${KEPT}`;
}

export type DetailErrorKind = "not_found" | "retryable";

export interface DetailError {
  kind: DetailErrorKind;
  message: string;
}

export const DETAIL_NOT_FOUND_MESSAGE = "Cet exercice est introuvable : il a peut-être été régénéré. Choisissez-en un dans la liste.";

/** Erreur de chargement du détail : un 404 ramène à la liste, le reste propose « Réessayer ». */
export function detailError(err: unknown): DetailError {
  const info = describeError(err);
  if (info.status === 404) return { kind: "not_found", message: DETAIL_NOT_FOUND_MESSAGE };
  return { kind: "retryable", message: info.message };
}
