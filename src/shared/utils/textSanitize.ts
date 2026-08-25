/**
 * Normalisation défensive du texte extrait (OCR / PDF pipeline).
 * Corrige les artefacts courants sans dépendance externe.
 *
 * @see plan-sync-frontend-backend.md — étape 7
 */

/**
 * Remplace les occurrences d'un pattern par le résultat d'un callback.
 * Comme String.replace() avec fonction, mais typé correctement.
 */
function replaceWith(
  text: string,
  pattern: RegExp,
  replacer: (match: string, ...groups: string[]) => string,
): string {
  return text.replace(pattern, replacer);
}

// ─── ASCII diacritiques isolés (hˆotes → hôtes, `a → à) ──
const ASCII_DIACRITIC_MAP: Record<string, string> = {
  "^a": "â", "^e": "ê", "^i": "î", "^o": "ô", "^u": "û",
  "^A": "Â", "^E": "Ê", "^I": "Î", "^O": "Ô", "^U": "Û",
  "`a": "à", "`e": "è", "`A": "À", "`E": "È",
  "'a": "á", "'e": "é", "'i": "í", "'o": "ó", "'u": "ú",
  "'A": "Á", "'E": "É", "'I": "Í", "'O": "Ó", "'U": "Ú",
  "~n": "ñ", "~N": "Ñ",
};

// ─── Unicode diacritiques combinants mal ordonnés ────────
function fixUnicodeDiacritics(text: string): string {
  let result = text;

  // Circonflexe combinant (U+0302) avant voyelle
  result = replaceWith(result, /\u0302([aeiouAEIOU])/gi, (_m, v: string) => {
    const map: Record<string, string> = {
      a: "â", e: "ê", i: "î", o: "ô", u: "û",
      A: "Â", E: "Ê", I: "Î", O: "Ô", U: "Û",
    };
    return map[v] ?? v;
  });

  // Accent aigu combinant (U+0301) avant voyelle
  result = replaceWith(result, /\u0301([aeiouAEIOU])/gi, (_m, v: string) => {
    const map: Record<string, string> = {
      a: "á", e: "é", i: "í", o: "ó", u: "ú",
      A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú",
    };
    return map[v] ?? v;
  });

  // Accent grave combinant (U+0300) avant a/e
  result = result.replace(/\u0300a/g, "à");
  result = result.replace(/\u0300A/g, "À");
  result = result.replace(/\u0300e/g, "è");
  result = result.replace(/\u0300E/g, "È");

  // Tréma combinant (U+0308) avant voyelle
  result = replaceWith(result, /\u0308([aeiouAEIOU])/gi, (_m, v: string) => {
    const map: Record<string, string> = {
      a: "ä", e: "ë", i: "ï", o: "ö", u: "ü",
      A: "Ä", E: "Ë", I: "Ï", O: "Ö", U: "Ü",
    };
    return map[v] ?? v;
  });

  // Cédille combinant (U+0327) après c
  result = result.replace(/\u0327c/g, "ç");
  result = result.replace(/\u0327C/g, "Ç");

  return result;
}

/**
 * Corrige les paires ASCII courantes : lettre + accent isolé.
 * Ex: "hˆotes" → "hôtes", "`a" → "à"
 */
function fixAsciiDiacritics(text: string): string {
  let result = text;
  for (const [pair, replacement] of Object.entries(ASCII_DIACRITIC_MAP)) {
    const escaped = pair[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped + "([aeiouAEIOU])"), (_m, v: string) => {
      // On utilise le couple (accent, voyelle) pour trouver la bonne lettre
      const key = pair[0] + v;
      return ASCII_DIACRITIC_MAP[key] ?? v;
    });
  }
  return result;
}

/**
 * Normalise le texte extrait pour corriger les artefacts OCR / PDF.
 *
 * Étapes :
 * 1. NFC Unicode (compose les diacritiques combinants)
 * 2. Correction des paires ASCII + accent isolé (ex: `^o` → `ô`)
 * 3. Correction des diacritiques Unicode mal ordonnés
 * 4. Normalisation du puce ▶ en marqueur de liste standard
 *
 * @param text - texte brut à nettoyer
 * @returns texte normalisé
 */
export function sanitizeExtractedText(text: string): string {
  if (!text) return text;

  let result = text.normalize("NFC");

  // Correction ASCII diacritiques (hˆotes → hôtes)
  result = fixAsciiDiacritics(result);

  // Correction Unicode diacritiques combinants
  result = fixUnicodeDiacritics(result);

  // Normaliser la puce ▶ en tiret standard pour la détection de liste
  result = result.replace(/▶\s*/g, "- ");

  return result;
}
