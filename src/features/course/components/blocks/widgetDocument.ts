import { TOOLKIT_CSS, TOOLKIT_SCRIPT } from "./widgetToolkit";

export type WidgetTheme = "light" | "dark";

/** Identifiant des messages postés par le document du widget (contrôlé par le parent). */
export const WIDGET_MESSAGE_SOURCE = "synthoria-widget";

/** CSP du document : aucun accès réseau, seuls les scripts/styles inline et les images `data:` passent. */
export const WIDGET_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'";

const THEME_VARS: Record<WidgetTheme, Record<string, string>> = {
  light: {
    "--w-bg": "#ffffff",
    "--w-fg": "#111827",
    "--w-muted": "#6b7280",
    "--w-accent": "#4f46e5",
    "--w-border": "#e5e7eb",
    "--w-surface": "#f9fafb",
  },
  dark: {
    "--w-bg": "#111827",
    "--w-fg": "#f3f4f6",
    "--w-muted": "#9ca3af",
    "--w-accent": "#818cf8",
    "--w-border": "#374151",
    "--w-surface": "#1f2937",
  },
};

/** Mesure la hauteur du contenu et la poste au parent ; relaie les erreurs. Aucune donnée reçue n'est lue. */
const MEASURE_SCRIPT = `(function(){
var S="${WIDGET_MESSAGE_SOURCE}",last=0;
function send(m){try{parent.postMessage(Object.assign({source:S},m),"*")}catch(e){}}
function measure(){
var b=document.body,d=document.documentElement;
var h=Math.ceil(Math.max(b?b.scrollHeight:0,d?d.scrollHeight:0));
if(h>0&&h!==last){last=h;send({type:"height",height:h})}
}
window.onerror=function(m){send({type:"error",message:String(m).slice(0,200)});return false};
window.addEventListener("unhandledrejection",function(){send({type:"error",message:"unhandledrejection"})});
if(typeof ResizeObserver==="function"){
var ro=new ResizeObserver(measure);ro.observe(document.documentElement);if(document.body)ro.observe(document.body);
}
window.addEventListener("load",measure);
document.addEventListener("DOMContentLoaded",measure);
measure();
})();`;

function themeCss(theme: WidgetTheme): string {
  return Object.entries(THEME_VARS[theme])
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

/**
 * Construit le document `srcdoc` d'un widget. Fonction pure : seul `html` (fragment de body fourni par
 * le modèle) est inséré tel quel ; tout le reste est constant ou dérivé de `theme` (valeurs fixes).
 * La CSP est la première balise du `<head>`, suivie du thème, de la boîte à outils `window.SW` (style puis
 * script, avant le script de mesure) ; le fragment du modèle ne l'atteint qu'après, dans le body.
 */
export function buildWidgetDocument({ html, theme }: { html: string; theme: WidgetTheme }): string {
  const safeTheme: WidgetTheme = theme === "dark" ? "dark" : "light";
  return `<!doctype html>
<html lang="fr">
<head>
<meta http-equiv="Content-Security-Policy" content="${WIDGET_CSP}">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{${themeCss(safeTheme)};color-scheme:${safeTheme}}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
body{padding:12px;background:var(--w-bg);color:var(--w-fg);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:15px;line-height:1.5}
button,input,select,textarea{font:inherit;color:inherit}
</style>
<style>${TOOLKIT_CSS}</style>
<script>${TOOLKIT_SCRIPT}</script>
<script>${MEASURE_SCRIPT}</script>
</head>
<body>
${html}
</body>
</html>`;
}

export const WIDGET_MIN_HEIGHT = 160;
export const WIDGET_MAX_HEIGHT = 1100;
export const WIDGET_DEFAULT_HEIGHT = 320;

export function clampWidgetHeight(value: number): number {
  return Math.min(WIDGET_MAX_HEIGHT, Math.max(WIDGET_MIN_HEIGHT, Math.round(value)));
}

export type WidgetMessage = { type: "height"; height: number } | { type: "error" };

/**
 * Valide un message reçu. Ne vérifie PAS la source (`event.source`) : c'est au composant de le faire.
 * Tout ce qui n'est pas un message "height" (nombre fini) ou "error" attendu est ignoré (null).
 */
export function parseWidgetMessage(data: unknown): WidgetMessage | null {
  if (typeof data !== "object" || data === null) return null;
  const msg = data as Record<string, unknown>;
  if (msg.source !== WIDGET_MESSAGE_SOURCE) return null;
  if (msg.type === "error") return { type: "error" };
  if (msg.type === "height" && typeof msg.height === "number" && Number.isFinite(msg.height)) {
    return { type: "height", height: clampWidgetHeight(msg.height) };
  }
  return null;
}
