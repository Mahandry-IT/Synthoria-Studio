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

/** Fragment de texte brut ou formule LaTeX (sans délimiteurs). */
export type TextOrMath = { text: string } | { math: string };

/**
 * Indice « nu » écrit hors de toute formule : `Q_1`, `x_i`, `Q_{12}`.
 * Une seule lettre, isolée (ni mot ni commande LaTeX avant), suivie d'un indice court :
 * `file_name`, `x_max` ou `snake_case` ne correspondent donc pas.
 */
const BARE_SUBSCRIPT = /(?<![A-Za-z0-9_\\])([A-Za-z])_(\{[A-Za-z0-9]{1,6}\}|\d{1,2}|[A-Za-z])(?![A-Za-z0-9_])/g;

/**
 * Découpe un texte brut (sans `$`) en fragments texte / formule : le modèle écrit souvent
 * « Q_1 » sans délimiteurs, ce qui s'affichait tel quel au lieu de Q₁.
 */
export function splitBareSubscripts(text: string): TextOrMath[] {
  const parts: TextOrMath[] = [];
  let last = 0;

  for (const match of text.matchAll(BARE_SUBSCRIPT)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: text.slice(last, index) });
    parts.push({ math: `${match[1]}_${match[2]}` });
    last = index + match[0].length;
  }

  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
