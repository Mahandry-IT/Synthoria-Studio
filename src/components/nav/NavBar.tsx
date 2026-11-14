"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { cx } from "@/shared/utils/cx";
import { formatNavCount } from "./navCounts";
import { navHref } from "./navConfig";
import { NavIcon, ThemeIcon } from "./navIcons";
import type { NavViewProps } from "./nav.types";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent";

/** Centre horizontalement l'élément actif d'une ligne défilante, sans faire défiler la page. */
function centerActive(scroller: HTMLElement | null) {
  const el = scroller?.querySelector<HTMLElement>("[aria-current]");
  if (!scroller || !el) return;
  scroller.scrollLeft = el.offsetLeft - (scroller.clientWidth - el.offsetWidth) / 2;
}

/**
 * Navigation horizontale (< lg) : une ligne de groupes puis une ligne de sous-éléments, chacune
 * défilante. Un seul `nav`, collé en haut du contenu ; groupe et sous-élément actifs centrés.
 */
export function NavBar({
  groups,
  activeGroupId,
  activeItemId,
  shownGroupId,
  onSelectGroup,
  counts,
  onNavigate,
  theme,
}: NavViewProps) {
  const shown = groups.find((g) => g.id === shownGroupId) ?? groups[0];
  const groupsRef = useRef<HTMLUListElement>(null);
  const itemsRef = useRef<HTMLUListElement>(null);

  useEffect(() => centerActive(groupsRef.current), [activeGroupId]);
  useEffect(() => centerActive(itemsRef.current), [shown.id, activeItemId]);

  return (
    <nav
      aria-label="Navigation principale"
      className="sticky top-0 z-30 shrink-0 border-b border-line bg-surface lg:hidden"
    >
      <div className="flex items-center gap-1.5 pl-3.5">
        <Image
          src="/logo-mark.svg"
          alt="Synthoria"
          width={32}
          height={32}
          unoptimized
          priority
          className="h-8 w-8 shrink-0"
        />
        <ul ref={groupsRef} className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {groups.map((group) => {
            const isShown = group.id === shown.id;
            return (
              <li key={group.id} className="flex-none">
                <button
                  type="button"
                  aria-expanded={isShown}
                  aria-current={group.id === activeGroupId ? "true" : undefined}
                  onClick={() => onSelectGroup(group.id)}
                  className={cx(
                    "flex min-h-11 items-center gap-2 rounded-full px-3.5 text-sm font-medium",
                    "transition-colors duration-(--d-fast) motion-reduce:transition-none",
                    isShown ? "bg-primary font-semibold text-primary-ink" : "text-ink-2 hover:bg-sunken",
                    FOCUS,
                  )}
                >
                  <NavIcon name={group.icon} small />
                  {group.label}
                </button>
              </li>
            );
          })}
        </ul>
        {theme && (
          <button
            type="button"
            onClick={theme.onToggle}
            aria-label={theme.dark ? "Passer au thème clair" : "Passer au thème sombre"}
            className={cx("mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-sunken", FOCUS)}
          >
            <ThemeIcon dark={theme.dark} />
          </button>
        )}
      </div>

      <ul
        ref={itemsRef}
        aria-label={shown.title}
        className="flex gap-1.5 overflow-x-auto border-t border-line bg-bg px-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shown.items.map((item) => {
          const isCurrent = item.id === activeItemId;
          const count = item.count ? formatNavCount(counts[item.count]) : "";
          return (
            <li key={item.id} className="flex-none">
              <Link
                href={navHref(item)}
                onClick={onNavigate}
                aria-current={isCurrent ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm",
                  isCurrent ? "border-accent font-semibold text-ink" : "border-transparent text-ink-2 hover:text-ink",
                  FOCUS,
                )}
              >
                <NavIcon name={item.icon} small />
                {item.label}
                {count && <span className="text-xs text-ink-3">{count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
