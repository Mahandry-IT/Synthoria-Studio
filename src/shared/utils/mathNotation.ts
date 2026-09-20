/** Lettres grecques usuelles en notation statistique (μ̂, σ̄…). */
const GREEK = "alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|omega";

/** `x_bar`, `mu_hat`… : une variable (une lettre ou une lettre grecque) et son accent, écrits en toutes lettres. */
const ACCENTED_VARIABLE = new RegExp(`^(${GREEK}|[A-Za-z])_(bar|hat|tilde|vec)$`);

/**
 * Convertit une notation « variable + accent » écrite en toutes lettres en LaTeX.
 * Le modèle écrit souvent `x_bar` (x barre) en code inline : à l'affichage, on veut un vrai x̄.
 *
 * @returns la formule LaTeX (sans délimiteurs) ou `null` si `code` n'est pas une telle notation.
 * @example toAccentedMath("x_bar") // "\bar{x}"
 * @example toAccentedMath("mu_hat") // "\hat{\mu}"
 */
export function toAccentedMath(code: string): string | null {
  const match = ACCENTED_VARIABLE.exec(code.trim());
  if (!match) return null;

  const [, variable, accent] = match;
  const symbol = variable.length > 1 ? `\\${variable}` : variable;
  return `\\${accent}{${symbol}}`;
}
