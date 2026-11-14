import type { MermaidConfig } from "mermaid";
import type { Theme } from "@/shared/utils/theme";

/**
 * Mermaid n'accepte que des couleurs littérales (pas de `var(--…)`) : ces palettes sont des copies,
 * en hex, des tokens de `globals.css` (nom du token en commentaire). `mermaidConfig.test.ts` vérifie
 * l'égalité avec le CSS et les contrastes texte / fond.
 */
export const MERMAID_THEME_VARS = {
  light: {
    primaryColor: "#d6e4df", // primary-soft
    primaryBorderColor: "#1f4e4a", // primary
    primaryTextColor: "#1e2a28", // ink
    secondaryColor: "#efe7d8", // sunken
    secondaryBorderColor: "#8f8165", // line-strong
    secondaryTextColor: "#1e2a28", // ink
    tertiaryColor: "#fdfaf3", // surface
    tertiaryBorderColor: "#ddd2be", // line
    tertiaryTextColor: "#1e2a28", // ink
    lineColor: "#5c6863", // ink-3
    textColor: "#1e2a28", // ink
    mainBkg: "#d6e4df", // primary-soft
    nodeBorder: "#1f4e4a", // primary
    nodeTextColor: "#1e2a28", // ink
    clusterBkg: "#efe7d8", // sunken
    clusterBorder: "#bfb195", // line-2
    edgeLabelBackground: "#fdfaf3", // surface
    background: "#fdfaf3", // surface
    noteBkgColor: "#f4e3bf", // warn-soft
    noteBorderColor: "#7a4f00", // warn
    noteTextColor: "#1e2a28", // ink
    actorBkg: "#d6e4df", // primary-soft
    actorBorder: "#1f4e4a", // primary
    actorTextColor: "#1e2a28", // ink
    signalColor: "#5c6863", // ink-3
    signalTextColor: "#1e2a28", // ink
  },
  dark: {
    primaryColor: "#1f3532", // primary-soft
    primaryBorderColor: "#86cabd", // primary
    primaryTextColor: "#ede7d9", // ink
    secondaryColor: "#101413", // sunken
    secondaryBorderColor: "#6b7c73", // line-strong
    secondaryTextColor: "#ede7d9", // ink
    tertiaryColor: "#1b2220", // surface
    tertiaryBorderColor: "#2b3532", // line
    tertiaryTextColor: "#ede7d9", // ink
    lineColor: "#98a09a", // ink-3
    textColor: "#ede7d9", // ink
    mainBkg: "#1f3532", // primary-soft
    nodeBorder: "#86cabd", // primary
    nodeTextColor: "#ede7d9", // ink
    clusterBkg: "#101413", // sunken
    clusterBorder: "#415049", // line-2
    edgeLabelBackground: "#1b2220", // surface
    background: "#1b2220", // surface
    noteBkgColor: "#3a2e12", // warn-soft
    noteBorderColor: "#e3b95f", // warn
    noteTextColor: "#ede7d9", // ink
    actorBkg: "#1f3532", // primary-soft
    actorBorder: "#86cabd", // primary
    actorTextColor: "#ede7d9", // ink
    signalColor: "#98a09a", // ink-3
    signalTextColor: "#ede7d9", // ink
  },
} satisfies Record<Theme, Record<string, string>>;

/** Inter (variable `next/font`) d'abord, puis la pile système si la police n'est pas chargée. */
const FONT_FAMILY = 'var(--font-inter), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Configuration Mermaid alignée sur l'application, pour le thème demandé. `securityLevel` « strict »
 * et `htmlLabels: false` sont des garde-fous de sécurité : ne pas les assouplir.
 */
export function buildMermaidConfig(theme: Theme) {
  return {
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    fontFamily: FONT_FAMILY,
    themeVariables: {
      darkMode: theme === "dark",
      fontFamily: FONT_FAMILY,
      fontSize: "15px",
      ...MERMAID_THEME_VARS[theme],
    },
    flowchart: { htmlLabels: false, nodeSpacing: 50, rankSpacing: 55, padding: 12, curve: "basis" },
    sequence: { actorMargin: 60, messageMargin: 40, useMaxWidth: true },
  } satisfies MermaidConfig;
}
