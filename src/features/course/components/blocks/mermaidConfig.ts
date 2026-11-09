import type { MermaidConfig } from "mermaid";

const FONT_FAMILY = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Configuration Mermaid alignée sur l'application (accent indigo, gris Tailwind). `securityLevel`
 * « strict » et `htmlLabels: false` sont des garde-fous de sécurité : ne pas les assouplir.
 */
export const MERMAID_CONFIG = {
  startOnLoad: false,
  securityLevel: "strict",
  theme: "base",
  fontFamily: FONT_FAMILY,
  themeVariables: {
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    primaryColor: "#eef2ff",
    primaryBorderColor: "#4f46e5",
    primaryTextColor: "#111827",
    secondaryColor: "#f3f4f6",
    secondaryBorderColor: "#9ca3af",
    secondaryTextColor: "#111827",
    tertiaryColor: "#ffffff",
    tertiaryBorderColor: "#d1d5db",
    tertiaryTextColor: "#111827",
    lineColor: "#6b7280",
    textColor: "#111827",
    mainBkg: "#eef2ff",
    nodeBorder: "#4f46e5",
    nodeTextColor: "#111827",
    clusterBkg: "#f9fafb",
    clusterBorder: "#d1d5db",
    edgeLabelBackground: "#ffffff",
    background: "#ffffff",
    noteBkgColor: "#fffbeb",
    noteBorderColor: "#d97706",
    noteTextColor: "#111827",
    actorBkg: "#eef2ff",
    actorBorder: "#4f46e5",
    actorTextColor: "#111827",
    signalColor: "#6b7280",
    signalTextColor: "#111827",
  },
  flowchart: { htmlLabels: false, nodeSpacing: 50, rankSpacing: 55, padding: 12, curve: "basis" },
  sequence: { actorMargin: 60, messageMargin: 40, useMaxWidth: true },
} satisfies MermaidConfig;
