"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CourseDiagram } from "../../course.types";
import { sanitizeSvg, stripStyleDirectives } from "./diagramSvg";

/** Même borne que le backend (`DIAGRAM_SOURCE_MAX`) : au-delà, on n'appelle pas Mermaid. */
export const DIAGRAM_SOURCE_MAX = 4000;

/**
 * Schéma Mermaid. Mermaid est chargé à la demande (import dynamique) ; la source est traitée comme
 * non fiable : directives de style retirées avant rendu, mode `strict`, libellés sans HTML, SVG
 * nettoyé puis inséré sans `innerHTML`. Une source invalide affiche un message lisible et la
 * source brute (non modifiée, pour le débogage), jamais une page cassée.
 */
export function DiagramBlock({ diagram }: { diagram: CourseDiagram }) {
  const reactId = useId().replace(/:/g, "");
  const container = useRef<HTMLDivElement>(null);
  const tooLarge = diagram.mermaid.length > DIAGRAM_SOURCE_MAX;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tooLarge) return;
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          flowchart: { htmlLabels: false },
        });
        const { svg } = await mermaid.render(`diagram-${reactId}`, stripStyleDirectives(diagram.mermaid));
        if (cancelled) return;
        const node = sanitizeSvg(svg);
        if (!node) throw new Error("SVG invalide");
        container.current?.replaceChildren(node);
        setError(null);
      } catch {
        if (!cancelled) setError("Ce schéma n'a pas pu être affiché (syntaxe invalide).");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [diagram.mermaid, reactId, tooLarge]);

  const message = tooLarge ? "Schéma trop volumineux pour être affiché." : error;

  return (
    <figure className="my-3 w-full rounded-lg border border-gray-200 bg-white p-3">
      {diagram.caption && (
        <figcaption className="mb-2 text-sm font-semibold text-gray-900">{diagram.caption}</figcaption>
      )}
      {message ? (
        <div role="alert" className="text-sm text-amber-700">
          <p>{message}</p>
          {!tooLarge && (
            <pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs text-gray-700">{diagram.mermaid}</pre>
          )}
        </div>
      ) : (
        <div ref={container} className="overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full" />
      )}
    </figure>
  );
}
