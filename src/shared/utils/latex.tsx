"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Échappe les caractères spéciaux pour KaTeX.
 * KaTeX n'a pas de métriques pour certains caractères (€, etc.) en mode text.
 */
function escapeKatexText(text: string): string {
  // Caractères spéciaux qui doivent être échappés dans le mode texte KaTeX
  return text
    .replace(/€/g, "\euro ")
    .replace(/£/g, "\pounds ")
    .replace(/©/g, "\copyright ")
    .replace(/®/g, "\textregistered ")
    .replace(/™/g, "\texttrademark ")
    .replace(/°/g, "\degree ")
    .replace(/§/g, "\S ");
}

/**
 * Rendu inline de texte contenant du LaTeX ($...$ et $$...$$).
 * Parse le texte, extrait les blocs math et les rend avec KaTeX.
 */
export function LatexText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Split by LaTeX delimiters: $...$ for inline, $$...$$ for display
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

    ref.current.innerHTML = "";
    for (const part of parts) {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        const math = part.slice(2, -2).trim();
        const span = document.createElement("span");
        try {
          katex.render(math, span, { displayMode: true, throwOnError: false, strict: false });
        } catch {
          span.textContent = math;
        }
        ref.current.appendChild(span);
      } else if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        const math = part.slice(1, -1).trim();
        const span = document.createElement("span");
        try {
          katex.render(math, span, { displayMode: false, throwOnError: false, strict: false });
        } catch {
          span.textContent = math;
        }
        ref.current.appendChild(span);
      } else {
        // Texte hors LaTeX : échapper les caractères spéciaux pour KaTeX
        ref.current.appendChild(document.createTextNode(escapeKatexText(part)));
      }
    }
  }, [text]);

  return <span ref={ref} className={className} />;
}
