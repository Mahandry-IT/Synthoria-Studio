"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  INITIAL_PAGER_STATE,
  clampStep,
  followLatestState,
  goToState,
  isStepMounted,
  pagerCounter,
  pagerLabel,
  stepForKey,
  swipeDirection,
  type PagerState,
  type SlideDirection,
} from "@/features/course/stepPager";
import { Button } from "./Button";

/** Classe de glissement de l'étape affichée (définie dans globals.css, coupée en mouvement réduit). */
export const SLIDE_CLASSES: Record<SlideDirection, string> = {
  next: "step-slide-next",
  prev: "step-slide-prev",
};

/**
 * État d'affichage d'un lecteur à étapes : sans choix explicite, l'étape affichée est la dernière
 * dévoilée (reprise, nouvelle étape débloquée) ; les flèches choisissent une étape déjà dévoilée.
 * Non persisté.
 */
export function useStepPager() {
  const [state, setState] = useState<PagerState>(INITIAL_PAGER_STATE);
  return {
    direction: state.direction,
    /** Index affiché pour `revealed` étapes dévoilées. */
    shownFor: (revealed: number) => clampStep(state.pick ?? revealed - 1, revealed),
    /** Affiche l'étape `index`, depuis l'étape `from` (donne le sens du glissement). */
    goTo: (index: number, from: number) => setState((s) => goToState(s, index, from)),
    /** Une étape vient d'être débloquée : on la suit (`from` : l'étape quittée). */
    followLatest: (from: number) => setState((s) => followLatestState(s, from)),
    /** Faut-il monter le contenu de l'étape `index` (affichée ou déjà vue) ? */
    isMounted: (index: number, shown: number) => isStepMounted(state, index, shown),
  };
}

// Champs, code, tableaux, et contenus qui se font déjà défiler ou manipuler au doigt (diagrammes, graphiques, widgets).
export const NO_SWIPE_SELECTOR =
  "input, textarea, select, [contenteditable='true'], pre, table, svg, canvas, iframe, [data-no-swipe]";

/** Vrai si le geste démarre dans un champ, un bloc de code, un tableau ou une zone à défilement horizontal. */
function startsInNoSwipeArea(target: EventTarget | null, zone: HTMLElement): boolean {
  let el = target instanceof HTMLElement ? target : null;
  while (el && el !== zone) {
    if (el.matches(NO_SWIPE_SELECTOR)) return true;
    if (el.scrollWidth > el.clientWidth + 1 && /(auto|scroll)/.test(getComputedStyle(el).overflowX)) return true;
    el = el.parentElement;
  }
  return false;
}

interface StepPagerProps {
  /** Index affiché, 0-based. */
  current: number;
  /** Nombre d'étapes dévoilées : borne de navigation. */
  revealed: number;
  /** Nombre total d'étapes (compteur « n / N »). */
  total: number;
  /** Titre de l'étape affichée (annoncé et affiché). */
  title: string;
  onChange: (index: number) => void;
  /** Nom accessible de la navigation (ex. « Étapes de la section »). */
  label: string;
  /** Mot de l'annonce (« Étape » par défaut, « Temps » pour le cycle). */
  unit?: string;
  /** Noms accessibles des flèches : à différencier d'un autre bouton « Étape suivante » de la page. */
  previousLabel?: string;
  nextLabel?: string;
  /** Les étapes (toutes montées, les non affichées en `hidden`). */
  children: ReactNode;
}

/**
 * Navigation par flèches entre les étapes déjà dévoilées : boutons précédent/suivant, compteur,
 * annonce `aria-live`, clavier (flèches, Début, Fin) actif seulement quand le focus est dans la barre,
 * balayage tactile sur la zone des étapes. Ne débloque jamais d'étape.
 */
export function StepPager({
  current,
  revealed,
  total,
  title,
  onChange,
  label,
  unit = "Étape",
  previousLabel = "Étape précédente",
  nextLabel = "Étape suivante",
  children,
}: StepPagerProps) {
  const navRef = useRef<HTMLElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const atStart = current <= 0;
  const atEnd = current >= revealed - 1;

  // Après un changement d'étape (clavier, balayage), la barre redevient visible si on l'avait dépassée.
  const keepPagerInView = () =>
    requestAnimationFrame(() => {
      const nav = navRef.current;
      if (nav && nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ block: "start" });
    });

  const change = (index: number) => {
    const nav = navRef.current;
    const hadFocus = Boolean(nav?.contains(document.activeElement));
    onChange(index);
    keepPagerInView();
    // Un bouton qui devient désactivé perd le focus : on le rend à l'autre flèche.
    if (hadFocus) {
      requestAnimationFrame(() => {
        if (nav && !nav.contains(document.activeElement)) nav.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
      });
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = stepForKey(current, event.key, revealed);
    if (target === null) return;
    event.preventDefault();
    if (target !== current) change(target);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    swipeStart.current =
      event.pointerType === "mouse" || startsInNoSwipeArea(event.target, event.currentTarget)
        ? null
        : { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const direction = swipeDirection(event.clientX - start.x, event.clientY - start.y);
    if (direction === null) return;
    const target = clampStep(current + direction, revealed);
    if (target !== current) change(target);
  };

  return (
    <div>
      <nav
        ref={navRef}
        aria-label={label}
        onKeyDown={onKeyDown}
        className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-3"
      >
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={previousLabel}
          disabled={atStart}
          onClick={() => change(current - 1)}
        >
          <ChevronLeftIcon fontSize="small" aria-hidden />
        </Button>
        <div className="min-w-0 flex-1 text-center">
          <p className="kicker" aria-hidden>
            {pagerCounter(current, total)}
          </p>
          <p className="sr-only" aria-live="polite">
            {pagerLabel(current, total, title, unit)}
          </p>
          <p className="truncate font-serif text-sm text-ink-2" aria-hidden>
            {title}
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={nextLabel}
          disabled={atEnd}
          onClick={() => change(current + 1)}
        >
          <ChevronRightIcon fontSize="small" aria-hidden />
        </Button>
      </nav>
      <div
        className="touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
      >
        {children}
      </div>
    </div>
  );
}
