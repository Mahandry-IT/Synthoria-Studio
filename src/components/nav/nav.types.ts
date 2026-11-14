import type { NavCounts } from "./navCounts";
import type { NavGroup } from "./navConfig";

/** Props communes au rail (desktop) et à la barre (mobile) : rendu pur, sans hook. */
export interface NavViewProps {
  groups: NavGroup[];
  /** Groupe contenant la page courante (`null` hors navigation). */
  activeGroupId: string | null;
  activeItemId: string | null;
  /** Groupe dont les sous-éléments sont affichés. */
  shownGroupId: string;
  onSelectGroup: (id: string) => void;
  counts: NavCounts;
  /** Appelé au clic sur un sous-élément (relit le hash de l'URL). */
  onNavigate: () => void;
  /** `null` : bouton de thème masqué (`DARK_THEME_ENABLED` faux). */
  theme: { dark: boolean; onToggle: () => void } | null;
}
