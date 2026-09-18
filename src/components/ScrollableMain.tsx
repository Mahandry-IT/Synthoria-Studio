"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Distance de défilement (px) à partir de laquelle le bouton apparaît. */
const SHOW_AFTER_PX = 300;

/**
 * Zone principale scrollable + bouton flottant « retour en haut ».
 * Le bouton apparaît quand on a défilé assez bas, en bas à droite.
 */
export function ScrollableMain({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const onScroll = () => setVisible(el.scrollTop > SHOW_AFTER_PX);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <main ref={mainRef} className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>

      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Remonter en haut de la page"
        tabIndex={visible ? 0 : -1}
        className={[
          "fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full",
          "bg-indigo-600 text-white shadow-lg transition-all duration-200",
          "hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        ].join(" ")}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}
