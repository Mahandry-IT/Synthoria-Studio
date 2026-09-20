import type { PodcastStatus } from "./podcast.types";

/** Durée en secondes → « 12:05 » ou « 1:02:05 » ; chaîne vide si la durée est inconnue. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

type BadgeVariant = "indigo" | "green" | "amber" | "gray" | "red";

interface StatusMeta {
  label: string;
  variant: BadgeVariant;
  /** Symbole texte : le statut n'est jamais porté par la couleur seule. */
  icon: string;
}

const STATUS_META: Record<PodcastStatus, StatusMeta> = {
  pending: { label: "En attente", variant: "gray", icon: "⏳" },
  scripting: { label: "Écriture du script", variant: "indigo", icon: "✍️" },
  synthesizing: { label: "Synthèse des voix", variant: "indigo", icon: "🎙️" },
  mixing: { label: "Montage audio", variant: "indigo", icon: "🎚️" },
  done: { label: "Prêt", variant: "green", icon: "✓" },
  failed: { label: "Échec", variant: "red", icon: "⚠" },
};

/** Libellé, variante de badge et icône d'un statut de job. */
export function podcastStatusMeta(status: PodcastStatus): StatusMeta {
  return STATUS_META[status];
}
