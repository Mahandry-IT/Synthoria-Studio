import type { Theme } from "@/shared/utils/theme";

/**
 * Couleurs littérales du graphique SVG par thème : copies, en hex, des tokens de `globals.css`
 * (`chartColors.test.ts` vérifie l'égalité avec le CSS et les contrastes sur `surface`).
 * `series` : 4 teintes distinctes (teal, terre cuite, or, bleu), cycliques ; ≥ 3:1 sur `surface`.
 */
export interface ChartPalette {
  series: readonly [string, string, string, string];
  /** Traits des axes (token `ink-3`). */
  axis: string;
  /** Graduations de l'axe vertical (token `ink-3`). */
  tick: string;
  /** Libellés de l'axe horizontal (token `ink-2`). */
  label: string;
  /** Contour de l'élément mis en avant (token `ink`). */
  outline: string;
  /** Séparation des secteurs (token `surface`). */
  sliceStroke: string;
}

export const CHART_COLORS: Record<Theme, ChartPalette> = {
  light: {
    series: ["#1f4e4a", "#b8481f", "#9a7000", "#4f5fa8"],
    axis: "#5c6863",
    tick: "#5c6863",
    label: "#46534f",
    outline: "#1e2a28",
    sliceStroke: "#fdfaf3",
  },
  dark: {
    series: ["#86cabd", "#ee8f66", "#e3b95f", "#9fb0f0"],
    axis: "#98a09a",
    tick: "#98a09a",
    label: "#bdb8ab",
    outline: "#ede7d9",
    sliceStroke: "#1b2220",
  },
};
