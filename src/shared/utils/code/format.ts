/**
 * Mise en forme de code reçu sur une seule ligne (le backend n'envoie pas toujours
 * les sauts de ligne). Langages à accolades et `;` : C, C++, Java, JS, CSS…
 */

const INDENT = "    ";
const BLOCK_KEYWORDS = /\b(class|struct|union|enum|namespace|interface|else|do|try|finally)\b/;
const INCLUDE = /^#\s*include\s*(?:<[^>\n]*>|"[^"\n]*")/;

/**
 * Découpe et indente du code écrit sur une seule ligne.
 * Un code qui contient déjà un saut de ligne est rendu tel quel : on ne touche pas
 * à un code déjà mis en forme.
 */
export function formatCode(code: string): string {
  if (code.includes("\n")) return code;
  const lines = breakLines(code);
  return lines.length > 1 ? lines.join("\n") : code;
}

/** Fin d'une chaîne ou d'un caractère littéral (`"..."`, `'...'`) ; fin du texte si non fermé. */
function findQuoteEnd(code: string, start: number): number {
  for (let i = start + 1; i < code.length; i++) {
    if (code[i] === "\\") i++;
    else if (code[i] === code[start]) return i;
  }
  return code.length - 1;
}

/** `= {`, `f({`, `v{1, 2}` : accolade d'initialisation, qui reste sur sa ligne. */
function isInitializerBrace(pending: string): boolean {
  const text = pending.trimEnd();
  if (/[=,(\[]$/.test(text)) return true;
  const attachedToName = text.length === pending.length && /\w$/.test(text);
  return attachedToName && !BLOCK_KEYWORDS.test(text);
}

/** `} else`, `};`, `})` : l'accolade fermante reste sur la même ligne que la suite. */
function continuesAfterBrace(code: string, from: number): boolean {
  return /^\s*(?:[;,)]|(?:else|while|catch|finally)\b)/.test(code.slice(from));
}

function breakLines(code: string): string[] {
  const lines: string[] = [];
  const braces: Array<"block" | "inline"> = [];
  let current = "";
  let parens = 0; // `(` et `[` ouverts : rien n'y est coupé (`for (a; b; c)`)
  let depth = 0; // accolades de bloc ouvertes : niveau d'indentation

  const inline = () => parens > 0 || braces.includes("inline");
  const emit = (level = depth) => {
    const text = current.trim();
    if (text) lines.push(INDENT.repeat(level) + text);
    current = "";
  };

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];

    if (ch === '"' || ch === "'") {
      const end = findQuoteEnd(code, i);
      current += code.slice(i, end + 1);
      i = end;
      continue;
    }

    if (ch === "/" && code[i + 1] === "/") {
      // Sur une seule ligne, tout ce qui suit `//` est un commentaire.
      const comment = code.slice(i).trim();
      if (current.trim() === "" && lines.length > 0) lines[lines.length - 1] += ` ${comment}`;
      else current += comment;
      break;
    }

    if (ch === "/" && code[i + 1] === "*") {
      const close = code.indexOf("*/", i + 2);
      const end = close === -1 ? code.length : close + 2;
      current += code.slice(i, end);
      i = end - 1;
      continue;
    }

    if (ch === "#" && current.trim() === "") {
      const include = INCLUDE.exec(code.slice(i));
      if (include) {
        current += include[0];
        i += include[0].length - 1;
        emit(0);
        continue;
      }
    }

    if (ch === "(" || ch === "[") parens++;
    else if ((ch === ")" || ch === "]") && parens > 0) parens--;

    if (ch === "{") {
      // Une accolade en tout début de code est un littéral (`{"a": 1}`), pas un bloc.
      const atStart = current.trim() === "" && lines.length === 0 && depth === 0;
      const kind = atStart || inline() || isInitializerBrace(current) ? "inline" : "block";
      braces.push(kind);
      current += ch;
      if (kind === "block") {
        emit();
        depth++;
      }
    } else if (ch === "}") {
      if (braces.pop() === "inline") {
        current += ch;
      } else {
        emit();
        depth = Math.max(0, depth - 1);
        current = ch;
        if (!continuesAfterBrace(code, i + 1)) emit();
      }
    } else if (ch === ";" && !inline()) {
      current += ch;
      emit();
    } else if (ch === ":" && !inline() && /^(?:public|private|protected)$/.test(current.trim())) {
      current += ch;
      emit(Math.max(0, depth - 1));
    } else {
      current += ch;
    }
  }

  emit();
  return lines;
}
