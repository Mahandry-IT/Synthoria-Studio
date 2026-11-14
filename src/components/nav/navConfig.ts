/** Clés des icônes, résolues en composants MUI par `navIcons.tsx` (garde cette config pure et testable). */
export type NavIconName =
  | "home"
  | "dashboard"
  | "pending"
  | "folder"
  | "file"
  | "upload"
  | "school"
  | "newCourse"
  | "history"
  | "review"
  | "repeat"
  | "tutor";

/** Compteurs affichables à droite d'un sous-élément. */
export type NavCountKey = "files" | "courses" | "reviews" | "plans";

export interface NavItem {
  id: string;
  label: string;
  /** Chemin d'une route existante de `src/app`. */
  path: string;
  /** Ancre sans `#` (ex. `plans`). */
  hash?: string;
  icon: NavIconName;
  count?: NavCountKey;
}

export interface NavGroup {
  id: string;
  label: string;
  /** Titre affiché en tête du tiroir. */
  title: string;
  icon: NavIconName;
  items: NavItem[];
}

/** Ancres ciblées dans les pages (ids posés sur la carte des plans et le panneau d'import). */
export const PLANS_ANCHOR = "plans";
export const IMPORT_ANCHOR = "import";

/**
 * Navigation unique du rail (desktop) et de la barre (mobile).
 * « Podcasts » et « Dossiers » du modèle sont volontairement absents : aucune page n'existe encore.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "accueil",
    label: "Accueil",
    title: "Accueil",
    icon: "home",
    items: [
      { id: "dashboard", label: "Tableau de bord", path: "/", icon: "dashboard" },
      { id: "plans", label: "Plans en attente", path: "/", hash: PLANS_ANCHOR, icon: "pending", count: "plans" },
    ],
  },
  {
    id: "fichiers",
    label: "Fichiers",
    title: "Fichiers",
    icon: "folder",
    items: [
      { id: "files", label: "Tous les fichiers", path: "/upload", icon: "file", count: "files" },
      { id: "import", label: "Importer un PDF", path: "/upload", hash: IMPORT_ANCHOR, icon: "upload" },
    ],
  },
  {
    id: "cours",
    label: "Cours",
    title: "Cours",
    icon: "school",
    items: [
      { id: "ask", label: "Nouveau cours", path: "/ask", icon: "newCourse" },
      { id: "history", label: "Historique", path: "/history", icon: "history", count: "courses" },
    ],
  },
  {
    id: "reviser",
    label: "Réviser",
    title: "Réviser",
    icon: "review",
    items: [
      { id: "review", label: "Révisions du jour", path: "/review", icon: "repeat", count: "reviews" },
      { id: "chat", label: "Tuteur", path: "/chat", icon: "tutor" },
    ],
  },
];

/** URL d'un sous-élément (`/upload#import`). */
export function navHref(item: NavItem): string {
  return item.hash ? `${item.path}#${item.hash}` : item.path;
}
