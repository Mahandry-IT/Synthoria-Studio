/** Messages de repli par statut HTTP, quand le backend ne fournit pas de `detail` exploitable. */
export const ERROR_MESSAGES: Readonly<Record<number, string>> = {
  400: "Requête invalide.",
  404: "Élément introuvable : il a peut-être été supprimé.",
  409: "Cette action entre en conflit avec l'état actuel. Rechargez la page.",
  410: "Cet élément a expiré.",
  413: "Votre contenu est trop long. Raccourcissez-le et réessayez.",
  422: "Les données envoyées sont invalides.",
  429: "Quota d'appels atteint. Réessayez dans quelques instants.",
  500: "Erreur interne du serveur. Réessayez plus tard.",
  502: "Réponse invalide du moteur IA. Réessayez.",
  503: "Le moteur IA est temporairement indisponible. Réessayez dans quelques instants.",
  504: "Le serveur a mis trop de temps à répondre. Réessayez.",
};

export const NETWORK_ERROR_MESSAGE = "Impossible de joindre le serveur. Vérifiez votre connexion.";
export const TIMEOUT_ERROR_MESSAGE = "La requête a pris trop de temps. Réessayez.";
export const UNKNOWN_ERROR_MESSAGE = "Une erreur inattendue est survenue.";
