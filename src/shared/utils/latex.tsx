"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

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
          katex.render(math, span, { displayMode: true, throwOnError: false });
        } catch {
          span.textContent = math;
        }
        ref.current.appendChild(span);
      } else if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        const math = part.slice(1, -1).trim();
        const span = document.createElement("span");
        try {
          katex.render(math, span, { displayMode: false, throwOnError: false });
        } catch {
          span.textContent = math;
        }
        ref.current.appendChild(span);
      } else {
        ref.current.appendChild(document.createTextNode(part));
      }
    }
  }, [text]);

  return <span ref={ref} className={className} />;
}
