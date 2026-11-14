"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { useDocumentTheme } from "@/shared/hooks/useDocumentTheme";
import type { CourseWidget } from "../../course.types";
import {
  WIDGET_DEFAULT_HEIGHT,
  buildWidgetDocument,
  clampWidgetHeight,
  parseWidgetMessage,
} from "./widgetDocument";

/** Délai sans mesure de hauteur au-delà duquel on bascule sur la description. */
const LOAD_TIMEOUT_MS = 3000;

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
    <div role="note" className="rounded-card border border-line bg-sunken px-4 py-3 text-sm text-ink-2">
      <p className="kicker mb-1">Widget indisponible</p>
      <p>{description || "Ce widget interactif n'a pas pu être affiché."}</p>
    </div>
  );
}

/** Widget interactif généré : exécuté dans une iframe sandboxée (scripts seulement, origine opaque, CSP sans réseau). */
export function WidgetBlock({ widget }: { widget: CourseWidget }) {
  const containerRef = useRef<HTMLElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const near = useNearViewport(containerRef);
  // Le thème n'entre que dans le `srcDoc` : un changement le reconstruit et recharge l'iframe.
  const theme = useDocumentTheme();
  const [reloadKey, setReloadKey] = useState(0);
  const [measured, setMeasured] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  // Au changement de thème l'iframe se recharge : mesure et échec précédents ne valent plus (comme « Recharger »).
  const [loadedTheme, setLoadedTheme] = useState(theme);
  if (loadedTheme !== theme) {
    setLoadedTheme(theme);
    setFailed(false);
    setMeasured(null);
  }

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
      {widget.title && <figcaption className="mb-1.5 text-sm font-medium text-ink">{widget.title}</figcaption>}
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
          className="w-full rounded-card border border-line bg-surface"
        />
      )}
      <div className="mt-1.5 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reload}>
          Recharger le widget
        </Button>
      </div>
    </figure>
  );
}
