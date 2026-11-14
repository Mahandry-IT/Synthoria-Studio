"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import { NavBar } from "./NavBar";
import { NavRail } from "./NavRail";
import { findActiveNav } from "./navActive";
import { NAV_GROUPS } from "./navConfig";
import { useLocationHash } from "./useLocationHash";
import { useNavCounts } from "./useNavCounts";

/** Largeur (px) à partir de laquelle le rail vertical remplace la barre horizontale. */
export const NAV_BREAKPOINT_PX = 1024;

/**
 * Coquille de navigation : calcule l'élément actif, les compteurs et le groupe affiché, puis monte
 * le rail (≥ 1024 px) et la barre (en dessous), masqués l'un ou l'autre par CSS (`display: none`). Choisir un groupe n'en change que
 * l'affichage ; il se réaligne sur la page dès que la navigation change de groupe.
 */
export function AppNav() {
  const pathname = usePathname();
  const { hash, refresh } = useLocationHash();
  const counts = useNavCounts();
  const { theme, toggleTheme, darkEnabled } = useTheme();

  const active = findActiveNav(NAV_GROUPS, pathname, hash);
  const activeGroupId = active?.groupId ?? null;
  // Sélection manuelle valable tant que le groupe de la page ne change pas
  const [pick, setPick] = useState<{ groupId: string; anchor: string | null } | null>(null);
  const shownGroupId =
    pick && pick.anchor === activeGroupId ? pick.groupId : (activeGroupId ?? NAV_GROUPS[0].id);

  const props = {
    groups: NAV_GROUPS,
    activeGroupId,
    activeItemId: active?.itemId ?? null,
    shownGroupId,
    onSelectGroup: (groupId: string) => setPick({ groupId, anchor: activeGroupId }),
    counts,
    onNavigate: refresh,
    theme: darkEnabled ? { dark: theme === "dark", onToggle: toggleTheme } : null,
  };

  // Les deux sont rendus (un seul visible par CSS) : pas de flash ni de saut au premier rendu
  return (
    <>
      <NavRail {...props} />
      <NavBar {...props} />
    </>
  );
}
