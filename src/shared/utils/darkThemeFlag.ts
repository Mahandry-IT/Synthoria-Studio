/**
 * Interprète la variable de build `NEXT_PUBLIC_DARK_THEME` : le thème sombre est exposé par défaut
 * et n'est désactivé (clair forcé, bascule masquée) que par la valeur exacte `"false"` ; absente ou
 * toute autre valeur → vrai.
 */
export function parseDarkThemeFlag(raw: string | undefined): boolean {
  return raw !== "false";
}
