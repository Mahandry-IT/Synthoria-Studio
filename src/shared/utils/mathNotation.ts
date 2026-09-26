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

// ─── Échappements LaTeX mangés par le JSON ───────────────────

/**
 * Caractères de contrôle produits quand le JSON du modèle contient `\frac`, `\times`, `\beta`… avec
 * une SEULE barre oblique : le décodeur JSON lit `\f`, `\t`, `\b`, `\r`, `\v`, `\n` comme des
 * échappements (saut de page, tabulation…) et la commande devient « <FF>rac{…} » (« rac{…} » à l'écran).
 * On ne les rétablit que devant le nom d'une commande LaTeX connue, pour ne pas toucher au texte normal.
 */
const CONTROL_CHAR_REPAIRS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\f(?=rac|orall)/g, "\\f"],
  [/\t(?=imes|ext|heta|ilde|riangle|au(?![a-z])|an(?![a-z]))/g, "\\t"],
  [/\x08(?=eta|ar(?![a-z])|inom|egin|oldsymbol|igcup|igcap)/g, "\\b"],
  [/\r(?=ho(?![a-z])|ight|angle)/g, "\\r"],
  [/\x0B(?=ec|arepsilon|arphi|ee(?![a-z]))/g, "\\v"],
  [/\n(?=eq(?![a-z])|abla)/g, "\\n"],
];

/**
 * Rétablit la barre oblique des commandes LaTeX dont le début a été lu comme un échappement JSON.
 * Idempotent : un texte déjà correct n'est pas modifié.
 *
 * @example repairLatexEscapes("\u000Crac{1}{2}") // String.raw`\frac{1}{2}`
 */
export function repairLatexEscapes(text: string): string {
  return CONTROL_CHAR_REPAIRS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
}

/**
 * `x^^*` : caret dupliqué par erreur devant un exposant (idem pour `_`). KaTeX rejette ce
 * « double exposant » et affiche toute la formule en rouge (source brute) au lieu de la rendre.
 * On ne fusionne que des carets/underscores strictement adjacents, jamais un exposant imbriqué
 * valide comme `x^{a^b}` (le `{a` entre les deux `^` les empêche d'être adjacents).
 *
 * @example repairDoubleScripts("x^^*") // "x^*"
 */
export function repairDoubleScripts(text: string): string {
  return text.replace(/\^{2,}/g, "^").replace(/_{2,}/g, "_");
}

/**
 * `\\bigcap`, `\\{`, `\\infty` : antislash doublé par erreur devant une commande LaTeX ou une
 * accolade échappée (le modèle sur-échappe parfois son propre backslash). KaTeX lit `\\` comme la
 * commande de saut de ligne, jamais comme un antislash littéral, donc `\\bigcap` échoue au lieu de
 * produire `\bigcap` (et pire, `^\\infty` échoue carrément : un saut de ligne n'est pas une valeur
 * d'exposant). Un vrai `\\` de saut de ligne (tableau, matrice) n'est jamais immédiatement suivi
 * d'une lettre ou d'une accolade — on ne fusionne donc que ce cas précis, jamais `a & b \\ c & d`.
 *
 * @example repairDoubledBackslash("\\\\bigcap_{k=1}^\\\\infty") // String.raw`\bigcap_{k=1}^\infty`
 */
export function repairDoubledBackslash(text: string): string {
  return text.replace(/\\{2,}(?=[A-Za-z{}])/g, "\\");
}

// ─── Formules écrites sans délimiteurs `$` ───────────────────

/** Fragment de texte brut ou formule LaTeX (sans délimiteurs). */
export type TextOrMath = { text: string } | { math: string };

/** Groupe entre accolades, avec un niveau d'imbrication (`{x^{2} - 9}`). */
const BRACED = String.raw`\{(?:[^{}]|\{[^{}]*\})*\}`;

/**
 * Commande LaTeX à arguments, écrite hors de toute formule : `\frac{a}{b}`, `\sqrt{x}`, `\sqrt[3]{x}`,
 * `\bar{x}`. Seules les commandes qui portent un sens visuel sont reconnues.
 */
const BARE_COMMAND = String.raw`\\(?:d?frac|tfrac|binom)${BRACED}${BRACED}|\\sqrt(?:\[[^\]]*\])?${BRACED}|\\(?:bar|hat|tilde|vec|overline)${BRACED}`;

/**
 * Indice « nu » : `Q_1`, `x_i`, `Q_{12}`. Une seule lettre, isolée (ni mot ni commande LaTeX avant),
 * suivie d'un indice court : `file_name`, `x_max` ou `snake_case` ne correspondent donc pas.
 */
const BARE_SUBSCRIPT = String.raw`(?<![A-Za-z0-9_\\])[A-Za-z]_(?:\{[A-Za-z0-9]{1,6}\}|\d{1,2}|[A-Za-z])(?![A-Za-z0-9_])`;

const BARE_MATH = new RegExp(`${BARE_COMMAND}|${BARE_SUBSCRIPT}`, "g");

/**
 * Découpe un texte brut (sans `$`) en fragments texte / formule. Le modèle oublie parfois les `$` :
 * « Q_1 » ou « \frac{x-3}{x+2} » s'affichaient tels quels au lieu de Q₁ ou d'une vraie fraction.
 */
export function splitBareMath(text: string): TextOrMath[] {
  const parts: TextOrMath[] = [];
  let last = 0;

  for (const match of text.matchAll(BARE_MATH)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: text.slice(last, index) });
    parts.push({ math: match[0] });
    last = index + match[0].length;
  }

  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/**
 * Formule sans ses délimiteurs (`$$…$$`, `$…$`, `\[…\]`, `\(…\)`), même s'il n'en reste qu'un côté.
 * Le modèle en ajoute parfois au LaTeX d'un bloc formule : ré-enveloppée dans `$$…$$`, la formule
 * gardait un `$` interne, erreur KaTeX (source affichée en rouge).
 */
export function stripMathDelimiters(latex: string): string {
  return latex
    .trim()
    .replace(/^(?:\$+|\\[[(])\s*/, "")
    .replace(/\s*(?:\$+|\\[\])])$/, "")
    .trim();
}
