/**
 * Interprète la variable de build `NEXT_PUBLIC_DARK_THEME` : seule la valeur exacte `"true"` expose
 * le thème sombre (builds de revue) ; absente ou autre → faux (comportement par défaut).
 */
export function parseDarkThemeFlag(raw: string | undefined): boolean {
  return raw === "true";
}
