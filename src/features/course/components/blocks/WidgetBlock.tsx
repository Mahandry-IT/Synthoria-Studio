"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CourseWidget } from "../../course.types";
import {
  WIDGET_DEFAULT_HEIGHT,
  buildWidgetDocument,
  clampWidgetHeight,
  parseWidgetMessage,
  type WidgetTheme,
} from "./widgetDocument";

/** Délai sans mesure de hauteur au-delà duquel on bascule sur la description. */
const LOAD_TIMEOUT_MS = 3000;

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/** Thème courant : classe `dark` sur <html> si présente, sinon clair (l'application n'a pas de mode sombre aujourd'hui). */
function useWidgetTheme(): WidgetTheme {
  return useSyncExternalStore(
    subscribeTheme,
    () => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    () => "light",
  );
}

/** Vrai dès que l'élément approche du viewport ; repli immédiat si IntersectionObserver est absent. */
function useNearViewport(ref: React.RefObject<HTMLElement | null>): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setNear(true), 0);
      return () => clearTimeout(t);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return near;
}

function Fallback({ description }: { description: string }) {
  return (
    <div role="note" className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Widget indisponible</p>
      <p>{description || "Ce widget interactif n'a pas pu être affiché."}</p>
    </div>
  );
}

/** Widget interactif généré : exécuté dans une iframe sandboxée (scripts seulement, origine opaque, CSP sans réseau). */
export function WidgetBlock({ widget }: { widget: CourseWidget }) {
  const containerRef = useRef<HTMLElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const near = useNearViewport(containerRef);
  const theme = useWidgetTheme();
  const [reloadKey, setReloadKey] = useState(0);
  const [measured, setMeasured] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const srcDoc = useMemo(() => buildWidgetDocument({ html: widget.html, theme }), [widget.html, theme]);
  const initialHeight = clampWidgetHeight(widget.height_hint ?? WIDGET_DEFAULT_HEIGHT);
  const height = measured ?? initialHeight;
  const hasMeasure = measured !== null;

  useEffect(() => {
    if (!near || failed) return;
    function onMessage(event: MessageEvent) {
      if (event.source === null || event.source !== iframeRef.current?.contentWindow) return;
      const msg = parseWidgetMessage(event.data);
      if (!msg) return;
      if (msg.type === "error") setFailed(true);
      else setMeasured(msg.height);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [near, failed, reloadKey]);

  useEffect(() => {
    if (!near || failed || hasMeasure) return;
    const timer = setTimeout(() => setFailed(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [near, failed, hasMeasure, reloadKey]);

  function reload() {
    setFailed(false);
    setMeasured(null);
    setReloadKey((k) => k + 1);
  }

  return (
    <figure ref={containerRef} className="my-3" aria-label={widget.title || "Widget interactif"}>
      {widget.title && <figcaption className="mb-1.5 text-sm font-medium text-gray-800">{widget.title}</figcaption>}
      {failed ? (
        <Fallback description={widget.description} />
      ) : (
        // Chargement paresseux : l'iframe existe d'emblée mais ne reçoit son `srcDoc` (donc n'exécute rien) qu'à l'approche du viewport.
        <iframe
          key={reloadKey}
          ref={iframeRef}
          sandbox="allow-scripts"
          srcDoc={near ? srcDoc : undefined}
          title={widget.title || "Widget interactif"}
          referrerPolicy="no-referrer"
          style={{ height }}
          className="w-full rounded-lg border border-gray-200 bg-white"
        />
      )}
      <div className="mt-1.5 flex justify-end">
        <button
          type="button"
          onClick={reload}
          className="rounded text-xs text-indigo-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Recharger le widget
        </button>
      </div>
    </figure>
  );
}
