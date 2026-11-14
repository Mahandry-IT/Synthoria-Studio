import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, KeyboardEvent } from "react";
import { cx } from "@/shared/utils/cx";
import { formatNavCount } from "./navCounts";
import { navHref } from "./navConfig";
import { NavIcon, ThemeIcon } from "./navIcons";
import type { NavViewProps } from "./nav.types";

export const NAV_DRAWER_ID = "nav-drawer";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Flèches haut/bas, Début, Fin : déplacent seulement le focus ; Entrée/Espace activent le groupe. */
function onGroupKeyDown(
  event: KeyboardEvent<HTMLButtonElement>,
  index: number,
  ids: string[],
) {
  const last = ids.length - 1;
  const next =
    event.key === "ArrowDown" ? (index + 1) % ids.length
    : event.key === "ArrowUp" ? (index - 1 + ids.length) % ids.length
    : event.key === "Home" ? 0
    : event.key === "End" ? last
    : null;
  if (next === null) return;
  event.preventDefault();
  const buttons = event.currentTarget.closest("[data-nav-groups]")?.querySelectorAll<HTMLButtonElement>("button");
  buttons?.[next]?.focus();
}

/**
 * Navigation verticale (≥ lg) : rail de 88 px (groupes) et tiroir de 232 px (sous-éléments du
 * groupe affiché, compteurs à droite). Un seul `nav` ; le tiroir glisse de 12 px à chaque changement
 * de groupe (animation coupée sous `prefers-reduced-motion`).
 */
export function NavRail({
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
  const ids = groups.map((g) => g.id);

  return (
    <nav aria-label="Navigation principale" className="flex h-full shrink-0 max-lg:hidden">
      <div className="flex w-22 flex-col items-center gap-1.5 border-r border-line bg-surface py-4">
        <Image
          src="/logo-mark.svg"
          alt="Synthoria"
          width={36}
          height={36}
          unoptimized
          priority
          className="mb-2 h-9 w-9 shrink-0"
        />
        <div data-nav-groups className="flex flex-col items-center gap-1.5">
          {groups.map((group, index) => {
            const isShown = group.id === shown.id;
            const isActive = group.id === activeGroupId;
            return (
              <button
                key={group.id}
                type="button"
                tabIndex={group.id === (activeGroupId ?? shown.id) ? 0 : -1}
                aria-expanded={isShown}
                aria-controls={NAV_DRAWER_ID}
                aria-current={isActive ? "true" : undefined}
                onClick={() => onSelectGroup(group.id)}
                onKeyDown={(e) => onGroupKeyDown(e, index, ids)}
                className={cx(
                  "flex min-h-16 w-18 flex-col items-center justify-center gap-1 rounded-card text-xs font-medium",
                  "transition-colors duration-(--d-fast) motion-reduce:transition-none",
                  isShown ? "font-semibold text-ink" : "text-ink-2 hover:text-ink",
                  FOCUS,
                )}
              >
                <span
                  className={cx(
                    "flex h-8 w-11 items-center justify-center rounded-full transition-colors duration-(--d-fast) motion-reduce:transition-none",
                    isActive ? "bg-primary text-primary-ink" : isShown ? "bg-sunken" : "hover:bg-sunken",
                  )}
                >
                  <NavIcon name={group.icon} />
                </span>
                <span>{group.label}</span>
              </button>
            );
          })}
        </div>
        <div className="grow" />
        {theme && (
          <button
            type="button"
            onClick={theme.onToggle}
            aria-label={theme.dark ? "Passer au thème clair" : "Passer au thème sombre"}
            className={cx(
              "flex min-h-16 w-18 flex-col items-center justify-center gap-1 rounded-card text-xs font-medium text-ink-2 hover:text-ink",
              FOCUS,
            )}
          >
            <span className="flex h-8 w-11 items-center justify-center rounded-full">
              <ThemeIcon dark={theme.dark} />
            </span>
            <span>Thème</span>
          </button>
        )}
      </div>

      <div
        id={NAV_DRAWER_ID}
        key={shown.id}
        className="nav-drawer flex w-58 flex-col gap-1 border-r border-line bg-bg px-3.5 py-6"
      >
        <p className="kicker mb-1">Synthoria Studio</p>
        <h2 className="mb-4 font-serif text-xl font-medium text-ink">{shown.title}</h2>
        <ul className="flex flex-col gap-1">
          {shown.items.map((item, index) => {
            const isCurrent = item.id === activeItemId;
            const count = item.count ? formatNavCount(counts[item.count]) : "";
            return (
              <li key={item.id} className="nav-item" style={{ "--i": index } as CSSProperties}>
                <Link
                  href={navHref(item)}
                  onClick={onNavigate}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cx(
                    "flex min-h-11 items-center gap-3 rounded-ctrl px-3 text-sm transition-colors duration-(--d-fast) motion-reduce:transition-none",
                    isCurrent ? "bg-sunken font-semibold text-ink" : "text-ink-2 hover:bg-sunken/60 hover:text-ink",
                    FOCUS,
                  )}
                >
                  <span className={cx("flex shrink-0", isCurrent && "text-accent")}>
                    <NavIcon name={item.icon} small />
                  </span>
                  <span className="truncate">{item.label}</span>
                  {count && <span className="ml-auto text-xs text-ink-3">{count}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
