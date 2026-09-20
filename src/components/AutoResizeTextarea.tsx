"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type ComponentProps } from "react";

/**
 * Textarea qui s'adapte à son contenu : le texte passe à la ligne et le champ grandit
 * en hauteur, sans barre de défilement ni redimensionnement manuel.
 * Se réajuste aussi quand la largeur change (redimensionnement de la fenêtre).
 */
export function AutoResizeTextarea({ className = "", ...props }: ComponentProps<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    // scrollHeight exclut les bordures, or la boîte est en border-box
    el.style.height = `${el.scrollHeight + (el.offsetHeight - el.clientHeight)}px`;
  }, []);

  // Après chaque changement de valeur (saisie ou valeur injectée)
  useLayoutEffect(fit, [fit, props.value]);

  // Quand la largeur change, le retour à la ligne change donc la hauteur nécessaire
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lastWidth = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === lastWidth) return;
      lastWidth = el.clientWidth;
      fit();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit]);

  return <textarea ref={ref} className={`resize-none overflow-hidden ${className}`} {...props} />;
}
