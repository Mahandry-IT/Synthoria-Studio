import type { NavGroup, NavItem } from "./navConfig";

export interface ActiveNav {
  groupId: string;
  itemId: string;
}

/** `#plans` ou `plans` donne `plans` ; vide donne `""`. */
function normalizeHash(hash: string): string {
  return hash.startsWith("#") ? hash.slice(1) : hash;
}

function pathMatches(itemPath: string, pathname: string): boolean {
  if (itemPath === "/") return pathname === "/";
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/**
 * Élément actif de la navigation, par préfixe de chemin (`/history/abc` active Historique ;
 * `/` seulement l'accueil). Un élément à ancre n'est actif que si le hash correspond ; il l'emporte
 * alors sur l'élément sans ancre du même chemin. `null` hors navigation (ex. `/design`).
 */
export function findActiveNav(groups: NavGroup[], pathname: string, hash: string): ActiveNav | null {
  const currentHash = normalizeHash(hash);
  let best: { score: number; groupId: string; item: NavItem } | null = null;

  for (const group of groups) {
    for (const item of group.items) {
      if (!pathMatches(item.path, pathname)) continue;
      if (item.hash && item.hash !== currentHash) continue;
      const score = item.path.length * 2 + (item.hash ? 1 : 0);
      if (!best || score > best.score) best = { score, groupId: group.id, item };
    }
  }
  return best ? { groupId: best.groupId, itemId: best.item.id } : null;
}
