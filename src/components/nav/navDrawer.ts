import { createStoredValue } from "@/shared/utils/storedValue";

export const NAV_DRAWER_STORAGE_KEY = "synthoria.nav.drawer.collapsed";

const COLLAPSED = "1";
const EXPANDED = "0";

/** Valeur relue du stockage : repliée seulement si elle vaut exactement « 1 » (défaut : dépliée). */
export function parseDrawerCollapsed(raw: string | null | undefined): boolean {
  return raw === COLLAPSED;
}

const drawerStore = createStoredValue<boolean>(
  NAV_DRAWER_STORAGE_KEY,
  parseDrawerCollapsed,
  (collapsed) => (collapsed ? COLLAPSED : EXPANDED),
);

export const subscribeDrawer = drawerStore.subscribe;

/** Tiroir replié ? Mémoire d'abord, puis localStorage ; faux si rien n'est mémorisé. */
export const readDrawerCollapsed = drawerStore.read;

export const storeDrawerCollapsed = drawerStore.write;
