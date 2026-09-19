// Élément « phrasing » (code) : ce composant est rendu dans des <p> et <li>.
// `not-italic font-normal` : le code ne doit pas hériter de l'italique ou du gras du texte voisin.

/** Extrait de code court, dans le fil du texte. Sélectionnable, non modifiable. */
export function InlineCode({ code }: { code: string }) {
  return (
    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] font-normal not-italic text-gray-800 [overflow-wrap:anywhere]">
      {code}
    </code>
  );
}
