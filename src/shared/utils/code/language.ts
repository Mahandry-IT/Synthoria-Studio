/**
 * Langage d'un extrait de code, pour la coloration syntaxique.
 *
 * Le langage indiqué après ``` (`cpp`, `python`…) est utilisé s'il est connu. Sinon on le déduit
 * du code par des signaux nets (`std::`, `SELECT … FROM`…) : l'auto-détection de highlight.js
 * se trompe sur les extraits courts (`std::sort(a, b);` y ressort en CSS).
 * Sans indice fiable, le code reste sans couleur.
 */

export const CODE_LANGUAGES = [
  "c",
  "cpp",
  "csharp",
  "java",
  "javascript",
  "typescript",
  "python",
  "php",
  "go",
  "rust",
  "kotlin",
  "sql",
  "bash",
  "css",
  "xml",
  "json",
  "yaml",
] as const;

export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

const ALIASES: Record<string, CodeLanguage> = {
  "c++": "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  "c#": "csharp",
  cs: "csharp",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  node: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  python3: "python",
  rs: "rust",
  golang: "go",
  kt: "kotlin",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "bash",
  terminal: "bash",
  html: "xml",
  htm: "xml",
  svg: "xml",
  yml: "yaml",
  jsonc: "json",
  postgresql: "sql",
  postgres: "sql",
  mysql: "sql",
  sqlite: "sql",
  plsql: "sql",
};

/** Étiquettes qui demandent explicitement un affichage sans couleur (sortie de programme, texte). */
const PLAIN_LABELS = new Set(["text", "txt", "plain", "plaintext", "output", "log", "none"]);

const KNOWN = new Set<string>(CODE_LANGUAGES);

// ─── Déduction par signaux ────────────────────────────────

/** Score minimal pour retenir un langage : un seul indice faible ne suffit pas. */
const MIN_SCORE = 3;

type Signal = readonly [pattern: RegExp, weight: number];

/** Sans `g` : `RegExp.test` reste sans état. L'ordre départage les égalités. */
const DETECTORS: ReadonlyArray<{ language: CodeLanguage; signals: readonly Signal[] }> = [
  {
    language: "cpp",
    signals: [
      [/\bstd::\w+/, 3],
      [/^\s*#\s*include\s*<[a-z_]+>/m, 3],
      [/\b(?:cout|cin|cerr|endl)\b/, 3],
      [/\busing\s+namespace\s+\w+/, 3],
      [/\.(?:push_back|emplace_back|pop_back)\s*\(/, 3],
      [/\bclass\s+\w+\s*:\s*(?:public|private|protected)\b/, 3],
      [/\b(?:nullptr|constexpr|typename|noexcept|override)\b|\btemplate\s*</, 2],
      [/\b(?:vector|map|set|array|unique_ptr|shared_ptr|optional)\s*</, 2],
      [/\b(?:public|private|protected)\s*:/, 2],
    ],
  },
  {
    language: "c",
    signals: [
      [/^\s*#\s*include\s*<\w+\.h>/m, 3],
      [/\b(?:printf|scanf|malloc|calloc|free|fgets|strlen|strcpy)\s*\(/, 2],
      [/\btypedef\b/, 2],
    ],
  },
  {
    language: "java",
    signals: [
      [/\bSystem\.(?:out|err)\.print/, 4],
      [/\bpublic\s+static\s+void\s+main\b/, 4],
      [/^\s*import\s+javax?\./m, 4],
      [/\b(?:public|private|protected)\s+(?:(?:static|final|abstract)\s+)*(?:class|interface|enum)\b/, 3],
      [/\bString\s*\[\]/, 2],
      [/@Override\b/, 2],
      [/\b(?:extends|implements)\s+\w+/, 2],
      [/\bnew\s+\w+(?:<[^>]*>)?\s*\(/, 1],
    ],
  },
  {
    language: "csharp",
    signals: [
      [/\bConsole\.(?:WriteLine|Write|ReadLine)\b/, 4],
      [/^\s*using\s+System\b/m, 4],
      [/\{\s*get;\s*(?:set;)?\s*\}/, 4],
      [/\bstring\s*\[\]/, 2],
      [/\bpublic\s+(?:static\s+)?(?:string|bool)\b/, 2],
    ],
  },
  {
    language: "python",
    signals: [
      [/^\s*def\s+\w+\s*\([^)]*\)\s*(?:->\s*[^:\n]+)?:\s*(?:#.*)?$/m, 4],
      [/^\s*class\s+\w+\s*(?:\([^)]*\))?\s*:\s*$/m, 4],
      [/^\s*(?:from\s+[\w.]+\s+import\s+\S|import\s+[\w.]+(?:\s+as\s+\w+)?\s*$)/m, 3],
      [/^\s*(?:if|elif|else|for|while|try|except|finally|with)\b[^{};\n]*:\s*$/m, 3],
      [/\bself\b/, 2],
      [/\b(?:None|True|False)\b/, 2],
      [/\brange\s*\(|\blambda\b[^:\n]*:|\bf"[^"\n]*\{/, 2],
      [/\bprint\s*\(/, 1],
    ],
  },
  {
    language: "javascript",
    signals: [
      [/\bconsole\.(?:log|error|warn|info)\s*\(/, 4],
      [/^\s*import\s+[^;\n]+\s+from\s+['"]/m, 4],
      [/\bfunction\b\s*[\w$]*\s*\(/, 3],
      [/\brequire\s*\(\s*['"]/, 3],
      [/\b(?:document|window)\.\w+/, 3],
      [/^\s*export\s+(?:default|const|function|class|async)\b/m, 3],
      [/\b(?:const|let)\s+[\w{[]/, 2],
      [/=>/, 2],
      [/===|!==/, 2],
      [/\basync\s+function\b|\bawait\s+\w+/, 2],
    ],
  },
  {
    language: "sql",
    signals: [
      [/\bSELECT\b[\s\S]+?\bFROM\b/i, 5],
      [/\bINSERT\s+INTO\b/i, 5],
      [/\bCREATE\s+(?:TABLE|DATABASE|INDEX|VIEW)\b/i, 5],
      [/\bUPDATE\s+\w+\s+SET\b/i, 5],
      [/\bDELETE\s+FROM\b/i, 5],
      [/\bALTER\s+TABLE\b/i, 5],
      [/\b(?:WHERE|GROUP\s+BY|ORDER\s+BY|INNER\s+JOIN|LEFT\s+JOIN)\b/i, 1],
    ],
  },
  {
    language: "bash",
    signals: [
      [/^#!\s*\/(?:usr\/)?bin\/(?:env\s+)?(?:ba|z)?sh\b/, 5],
      [/^\s*\$\s+\S/m, 3],
      [
        /^\s*(?:sudo|cd|ls|cat|grep|echo|chmod|chown|mkdir|rm|cp|mv|git|npm|npx|pnpm|yarn|pip3?|python3?|apt(?:-get)?|brew|docker|curl|wget|export|source|ssh|scp|touch|tar|kill|tail|head|sed|awk|find|make|node|java|javac|gcc|g\+\+|clang)\s+\S/m,
        3,
      ],
      [/\s\|\s|&&|\$\{?\w+\}?/, 1],
    ],
  },
  {
    language: "xml",
    signals: [
      [/^\s*<!DOCTYPE\s+html/i, 5],
      [/^\s*<([a-z][\w-]*)(?:\s[^<>]*)?>[\s\S]*<\/\1>\s*$/i, 4],
      [/^\s*<[a-z][\w-]*(?:\s[^<>]*)?\/>\s*$/i, 4],
      [/<\/(?:div|span|p|a|ul|li|body|html|head|h[1-6]|table|tr|td|form|button)>/i, 3],
    ],
  },
  {
    language: "css",
    signals: [
      [
        /\{[^}]*\b(?:color|background(?:-color)?|margin|padding|font-(?:size|family|weight)|width|height|display|border(?:-\w+)?|position|text-align|flex|grid|opacity|z-index)\s*:\s*[^;}]+/,
        4,
      ],
      [/^\s*@(?:media|import|keyframes|font-face)\b/m, 4],
    ],
  },
  {
    language: "php",
    signals: [
      [/<\?php/, 5],
      [/\$this->\w+|\$\w+->\w+/, 3],
      [/\becho\s+[$"']/, 2],
    ],
  },
  {
    language: "go",
    signals: [
      [/^\s*package\s+\w+\s*$/m, 4],
      [/\bfunc\s+(?:\([^)]*\)\s*)?\w+\s*\(/, 4],
      [/\bfmt\.\w+\s*\(/, 4],
      [/:=/, 2],
    ],
  },
  {
    language: "rust",
    signals: [
      [/\bfn\s+\w+\s*[(<]/, 4],
      [/\blet\s+mut\b/, 4],
      [/\b(?:println|print|vec|format)!\s*[([]/, 4],
      [/\bimpl\b/, 3],
    ],
  },
  {
    language: "kotlin",
    signals: [
      [/\bfun\s+\w+\s*\(/, 4],
      [/\bval\s+\w+/, 3],
    ],
  },
];

function isJson(code: string): boolean {
  const text = code.trim();
  if (!/^[{[]/.test(text)) return false;
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/** Langage le plus probable d'un code sans étiquette, ou `null` sans indice fiable. */
export function guessLanguage(code: string): CodeLanguage | null {
  if (isJson(code)) return "json";

  let best: CodeLanguage | null = null;
  let bestScore = MIN_SCORE - 1;
  for (const { language, signals } of DETECTORS) {
    const score = signals.reduce((sum, [pattern, weight]) => sum + (pattern.test(code) ? weight : 0), 0);
    if (score > bestScore) {
      best = language;
      bestScore = score;
    }
  }
  if (best) return best;

  // Instructions terminées par `;` ou accolades sans autre indice : famille C, colorée en C++.
  return /[;{}]/.test(code) ? "cpp" : null;
}

/**
 * Langage à utiliser pour colorer un code.
 * @param label - étiquette du bloc (```cpp), ou `null` s'il n'y en a pas
 * @returns le langage, ou `null` pour un affichage sans couleur
 */
export function resolveLanguage(label: string | null, code: string): CodeLanguage | null {
  const name = label?.trim().toLowerCase() ?? "";
  if (PLAIN_LABELS.has(name)) return null;
  if (KNOWN.has(name)) return name as CodeLanguage;
  if (name in ALIASES) return ALIASES[name];
  return guessLanguage(code);
}
