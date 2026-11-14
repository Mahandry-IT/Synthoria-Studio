"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Button } from "@/components/Button";
import { cx } from "@/shared/utils/cx";
import { LatexText } from "@/shared/utils/latex";
import {
  centerScrollTarget,
  chapterNumber,
  chapterView,
  isChapterStarted,
  scrollEdges,
  scrollTargetFor,
  type ChapterView,
  type ScrollEdges,
} from "../readerLayout";
import type { SectionStatus } from "../sectionProgress";

export interface SectionNavItem {
  key: string;
  title: string;
  status: SectionStatus;
  /** Durée estimée (« ~5 min », « 4–6 min ») ; absente des sections sans cycle. */
  duration?: string | null;
}

const STATUS_LABELS: Record<SectionStatus, string> = {
  done: "faite",
  in_progress: "en cours",
  todo: "à faire",
};

/** Filet supérieur et texte de chaque état ; le chapitre courant est déployé. */
const VIEW_CLASSES: Record<ChapterView, string> = {
  done: "border-t-primary text-ink-2 hover:text-ink",
  current: "min-w-40 max-w-72 border-t-accent text-ink sm:min-w-[14.5rem]",
  todo: "border-t-line-2 text-ink-3 hover:text-ink",
};

interface SectionNavProps {
  items: SectionNavItem[];
  currentKey: string | null;
  onSelect: (key: string) => void;
}

/** Fenêtre (ms) après le montage où le fil se place sans animation (la progression est restaurée juste après). */
const INITIAL_PLACEMENT_MS = 600;

/** Mouvement réduit : défilement immédiat plutôt que lissé. */
const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/**
 * Fil des chapitres : bandeau horizontal défilant, un bouton par section (fait / courant déployé / à faire),
 * chevrons de défilement dès `sm` et chapitre courant ramené dans la vue à chaque changement.
 * Sur mobile, seul le chapitre courant montre son titre (les autres le gardent pour les lecteurs d'écran).
 */
export function SectionNav({ items, currentKey, onSelect }: SectionNavProps) {
  const listRef = useRef<HTMLOListElement>(null);
  // Instant du montage : le placement initial et la restauration de la progression (juste après) sont immédiats.
  const mountedAt = useRef(0);
  const [edges, setEdges] = useState<ScrollEdges>({ canScrollBack: false, canScrollForward: false });

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const next = scrollEdges(list.scrollLeft, list.scrollWidth, list.clientWidth);
    setEdges((prev) =>
      prev.canScrollBack === next.canScrollBack && prev.canScrollForward === next.canScrollForward ? prev : next,
    );
  }, []);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  // Les bords sont aussi remesurés quand le contenu change (titres, sections ajoutées) sans changer la taille du fil.
  useEffect(() => {
    measure();
  }, [measure, items]);

  // Mesure initiale et à chaque redimensionnement (le premier rappel de l'observateur suit l'observation).
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure]);

  // Ramène le chapitre courant au centre du fil ; sans animation au premier affichage.
  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!list || !current) return;
    list.scrollTo({
      left: centerScrollTarget(current.offsetLeft, current.offsetWidth, list.scrollWidth, list.clientWidth),
      behavior: Date.now() - mountedAt.current < INITIAL_PLACEMENT_MS ? "auto" : scrollBehavior(),
    });
  }, [currentKey]);

  const scrollBy = (direction: -1 | 1) => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({
      left: scrollTargetFor(direction, list.scrollLeft, list.scrollWidth, list.clientWidth),
      behavior: scrollBehavior(),
    });
  };

  return (
    <nav aria-label="Sections du cours" className="flex items-center gap-2">
      <div className="hidden sm:block">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Sections précédentes"
          aria-disabled={!edges.canScrollBack}
          className="aria-disabled:cursor-default aria-disabled:opacity-45 aria-disabled:hover:translate-y-0"
          onClick={() => edges.canScrollBack && scrollBy(-1)}
        >
          <ChevronLeftIcon fontSize="small" aria-hidden="true" />
        </Button>
      </div>
      <ol
        ref={listRef}
        data-fade-end={edges.canScrollForward}
        onScroll={measure}
        className="chaps relative flex min-w-0 flex-1 items-stretch overflow-x-auto p-1"
      >
        {items.map((item, i) => {
          const isCurrent = item.key === currentKey;
          const view = chapterView(item.status, isCurrent);
          return (
            <li key={item.key} className="flex-none">
              <button
                type="button"
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => onSelect(item.key)}
                className={cx(
                  "mr-4 flex h-full min-h-11 min-w-12 flex-col gap-1.5 rounded-none border-t-[3px] pb-3 pr-3 pt-2.5 text-left sm:min-w-16",
                  VIEW_CLASSES[view],
                )}
              >
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  {chapterNumber(i)}
                  {item.status === "done" && <span aria-hidden="true">✓</span>}
                  {isChapterStarted(item.status, isCurrent) && (
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full border border-primary" />
                  )}
                </span>
                <span
                  className={
                    isCurrent
                      ? "font-serif text-[17px] font-semibold leading-snug"
                      : "max-w-44 text-[13px] font-medium leading-snug sr-only sm:not-sr-only"
                  }
                >
                  <LatexText text={item.title} />
                </span>
                {item.duration && (
                  <>
                    {isCurrent && (
                      <span aria-hidden="true" className="font-mono text-xs text-ink-3">
                        {item.duration}
                      </span>
                    )}
                    <span className="sr-only"> (durée estimée {item.duration})</span>
                  </>
                )}
                <span className="sr-only"> ({STATUS_LABELS[item.status]})</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="hidden sm:block">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Sections suivantes"
          aria-disabled={!edges.canScrollForward}
          className="aria-disabled:cursor-default aria-disabled:opacity-45 aria-disabled:hover:translate-y-0"
          onClick={() => edges.canScrollForward && scrollBy(1)}
        >
          <ChevronRightIcon fontSize="small" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
