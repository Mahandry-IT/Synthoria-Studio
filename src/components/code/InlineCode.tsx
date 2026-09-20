import { LatexText } from "@/shared/utils/latex";
import { toAccentedMath } from "@/shared/utils/mathNotation";

// Élément « phrasing » (code) : ce composant est rendu dans des <p> et <li>.
// `not-italic font-normal` : le code ne doit pas hériter de l'italique ou du gras du texte voisin.

/**
 * Extrait de code court, dans le fil du texte. Sélectionnable, non modifiable.
 * Exception : une notation mathématique écrite comme du code (`x_bar`) est rendue en formule (x̄).
 */
export function InlineCode({ code }: { code: string }) {
  const math = toAccentedMath(code);
  if (math) {
    return <LatexText text={`$${math}$`} className="not-italic font-normal" />;
  }

  return (
    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] font-normal not-italic text-gray-800 [overflow-wrap:anywhere]">
      {code}
    </code>
  );
}
