import { TOOLKIT_CSS, TOOLKIT_SCRIPT } from "./widgetToolkit";

export type WidgetTheme = "light" | "dark";

/** Identifiant des messages postés par le document du widget (contrôlé par le parent). */
export const WIDGET_MESSAGE_SOURCE = "synthoria-widget";

/** CSP du document : aucun accès réseau, seuls les scripts/styles inline et les images `data:` passent. */
export const WIDGET_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'";

/**
 * Variables `--w-*` lues par la boîte à outils `window.SW` et par les widgets. Le document sandboxé
 * ne peut pas hériter des variables de la page : ce sont des copies, en hex, des tokens de
 * `globals.css` (nom du token en commentaire), verrouillées par `widgetDocument.test.ts`.
 */
export const WIDGET_THEME_VARS: Record<WidgetTheme, Record<string, string>> = {
  light: {
    "--w-bg": "#fdfaf3", // surface
    "--w-fg": "#1e2a28", // ink
    "--w-muted": "#5c6863", // ink-3
    "--w-accent": "#1f4e4a", // primary
    "--w-border": "#ddd2be", // line
    "--w-surface": "#efe7d8", // sunken
  },
  dark: {
    "--w-bg": "#1b2220", // surface
    "--w-fg": "#ede7d9", // ink
    "--w-muted": "#98a09a", // ink-3
    "--w-accent": "#86cabd", // primary
    "--w-border": "#2b3532", // line
    "--w-surface": "#101413", // sunken
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
  return Object.entries(WIDGET_THEME_VARS[theme])
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

/**
 * Construit le document `srcdoc` d'un widget. Fonction pure : seul `html` (fragment de body fourni par
 * le modèle) est inséré tel quel ; tout le reste est constant ou dérivé de `theme` (valeurs fixes : variables `--w-*`, `color-scheme` et attribut `data-theme` de `<html>`,
 * que le widget peut lire en CSS). Le thème ne passe que par ce document, jamais par `allow-same-origin`.
 * La CSP est la première balise du `<head>`, suivie du thème, de la boîte à outils `window.SW` (style puis
 * script, avant le script de mesure) ; le fragment du modèle ne l'atteint qu'après, dans le body.
 */
export function buildWidgetDocument({ html, theme }: { html: string; theme: WidgetTheme }): string {
  const safeTheme: WidgetTheme = theme === "dark" ? "dark" : "light";
  return `<!doctype html>
<html lang="fr" data-theme="${safeTheme}">
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
