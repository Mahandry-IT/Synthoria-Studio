import { formatCode } from "./format";

/**
 * Détection du code dans le texte backend : blocs ```lang ... ``` et `inline`.
 *
 * Le code doit être rendu tel quel : on le masque avant toute normalisation
 * (accents OCR, listes `;`, tables `|`, formules `$`) puis on le réinjecte.
 */

export interface CodeSegment {
  /** Texte d'origine, backticks compris (pour ré-analyse par un rendu imbriqué). */
  raw: string;
  /** Code sans les backticks ; une boîte sur une seule ligne est découpée (voir `formatCode`). */
  code: string;
  /** Rendu en boîte (bloc) plutôt qu'en pastille inline. */
  block: boolean;
  /** Langage indiqué après ``` (ex. `cpp`), sinon `null`. */
  language: string | null;
}

// Caractères Private Use Area, distincts de ceux du masquage LaTeX (RichText).
const CODE_OPEN = "\uE002";
const CODE_CLOSE = "\uE003";
const TOKEN_SPLIT = new RegExp(`${CODE_OPEN}(\\d+)${CODE_CLOSE}`);

/**
 * 1. bloc ```[lang]\n...``` (la langue n'est reconnue que suivie d'un saut de ligne) ;
 * 2. inline `...` : sur une ligne, sans espace juste après l'ouvrant ni avant le
 *    fermant — un accent OCR isolé (`` `a la maison ``) n'est ainsi pas pris pour du code.
 */
const CODE_PATTERN =
  /```(?:([\w+#.-]+)[ \t]*\r?\n|[ \t]*\r?\n?)([\s\S]*?)```|`([^`\s](?:[^`\n]*[^`\s])?)`/g;

/** Au-delà, un extrait inline est affiché en boîte plutôt qu'en pastille. */
const INLINE_MAX_LENGTH = 60;
/** Instruction complète (`x = 1;`, `for (...) { ... }`) : contient `;`, `{` ou `}`. */
const STATEMENT_CHARS = /[;{}]/;
const STATEMENT_MIN_LENGTH = 4;

/**
 * Point isolé juste après une boîte de code (`` `x();`. ``) : le modèle ponctue sa phrase,
 * mais le point se retrouve seul sous la boîte. Ni `...` ni `.5` ne sont concernés.
 */
const ORPHAN_PERIOD = /^\s*\.(?=\s|$)\s*/;

function isBlockCode(code: string): boolean {
  if (code.includes("\n") || code.length > INLINE_MAX_LENGTH) return true;
  return code.length >= STATEMENT_MIN_LENGTH && STATEMENT_CHARS.test(code);
}

export interface MaskedCode {
  /** Texte où chaque extrait de code est remplacé par un jeton opaque. */
  masked: string;
  /** Extraits trouvés, dans l'ordre d'apparition. */
  segments: CodeSegment[];
  /** Réinjecte le texte d'origine (backticks compris) dans une chaîne masquée. */
  restore: (s: string) => string;
  /**
   * Découpe une chaîne masquée en morceaux de texte et extraits de code, en retirant
   * le point orphelin qui suit une boîte (pas celui qui suit une pastille : il ferme la phrase).
   */
  split: (s: string) => Array<string | CodeSegment>;
}

/**
 * Remplace chaque extrait de code par un jeton opaque.
 * À appliquer avant `maskMath` : un `$` dans du code n'est pas une formule.
 */
export function maskCode(text: string): MaskedCode {
  const segments: CodeSegment[] = [];

  const masked = text.replace(
    CODE_PATTERN,
    (raw, language: string | undefined, fenced: string | undefined, inline: string | undefined) => {
      const isFenced = fenced !== undefined;
      const source = isFenced ? fenced.replace(/\s+$/, "") : (inline as string);
      const block = isFenced || isBlockCode(source);
      segments.push({
        raw,
        // Une pastille reste telle quelle ; une boîte est mise en forme si elle tient sur une ligne.
        code: block ? formatCode(source) : source,
        block,
        language: isFenced ? (language ?? null) : null,
      });
      return `${CODE_OPEN}${segments.length - 1}${CODE_CLOSE}`;
    },
  );

  const restore = (s: string) =>
    s.replace(new RegExp(TOKEN_SPLIT.source, "g"), (_m, i: string) => segments[Number(i)]?.raw ?? "");

  const split = (s: string) => {
    const parts: Array<string | CodeSegment> = [];
    let afterBlock = false;

    // Les indices pairs sont du texte, les impairs l'index d'un extrait de code.
    s.split(TOKEN_SPLIT).forEach((piece, i) => {
      if (i % 2 === 1) {
        const segment = segments[Number(piece)];
        if (segment) parts.push(segment);
        afterBlock = segment?.block ?? false;
        return;
      }
      const text = afterBlock ? piece.replace(ORPHAN_PERIOD, "") : piece;
      afterBlock = false;
      if (text) parts.push(text);
    });

    return parts;
  };

  return { masked, segments, restore, split };
}
