"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CourseDiagram } from "../../course.types";
import { Button } from "@/components/Button";
import { ZOOM_DEFAULT, ZOOM_MAX, ZOOM_MIN, nextZoom } from "./diagramZoom";
import { MERMAID_CONFIG } from "./mermaidConfig";
import { quoteFlowchartLabels, sanitizeSvg, stripStyleDirectives } from "./diagramSvg";

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
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);

  useEffect(() => {
    if (tooLarge) return;
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize(MERMAID_CONFIG);
        const { svg } = await mermaid.render(`diagram-${reactId}`, quoteFlowchartLabels(stripStyleDirectives(diagram.mermaid)));
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
        <>
          <div role="group" aria-label="Zoom du schéma" className="mb-2 flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" aria-label="Zoom arrière" disabled={zoom <= ZOOM_MIN} onClick={() => setZoom((z) => nextZoom(z, -1))}>
              −
            </Button>
            <span aria-live="polite" className="min-w-12 text-center text-xs tabular-nums text-gray-600">
              {zoom} %
            </span>
            <Button type="button" variant="secondary" size="sm" aria-label="Zoom avant" disabled={zoom >= ZOOM_MAX} onClick={() => setZoom((z) => nextZoom(z, 1))}>
              +
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={zoom === ZOOM_DEFAULT ? "Taille réelle" : "Ajuster à la largeur"}
              disabled={zoom === ZOOM_DEFAULT}
              onClick={() => setZoom(ZOOM_DEFAULT)}
            >
              Ajuster
            </Button>
          </div>
          <div className="max-h-[70vh] overflow-auto rounded border border-gray-100">
            <div
              ref={container}
              style={{ width: `${zoom}%` }}
              className="mx-auto [&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
            />
          </div>
        </>
      )}
    </figure>
  );
}
