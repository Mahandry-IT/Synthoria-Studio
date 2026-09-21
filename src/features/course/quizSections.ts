/** Libellé « Sections concernées : 2, 5 » (positions 1-based, triées, sans doublon) ; null si aucune. */
export function formatSectionRefs(refs: number[] | undefined): string | null {
  const unique = [...new Set((refs ?? []).filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b);
  if (unique.length === 0) return null;
  return `${unique.length > 1 ? "Sections concernées" : "Section concernée"} : ${unique.join(", ")}`;
}
