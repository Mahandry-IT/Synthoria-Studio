/**
 * Copie du texte dans le presse-papiers.
 * `navigator.clipboard` n'existe qu'en contexte sécurisé (https, localhost) : en http
 * sur une IP locale, on retombe sur `execCommand("copy")`.
 *
 * @returns `true` si la copie a réussi
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission refusée ou document sans focus : on tente le repli.
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(area);
  }
}
