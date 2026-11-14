import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** Tokens hex (`--nom: #rrggbb;`) du bloc CSS commençant par `selector` dans `globals.css`. */
function tokensOf(selector: string): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`);
  if (start === -1) throw new Error(`Bloc « ${selector} » introuvable dans globals.css`);
  const block = css.slice(start, css.indexOf("\n}", start));
  const tokens = Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6});/g)].map((m) => [m[1], m[2]]));
  // Garde-fou : un format de fichier qui ne se lit plus ne doit pas faire passer les tests à vide.
  for (const required of ["bg", "surface", "ink", "primary", "accent"]) {
    if (!tokens[required]) throw new Error(`Token --${required} introuvable dans le bloc « ${selector} » de globals.css`);
  }
  return tokens;
}

/** Tokens de `globals.css` par thème (valeurs en minuscules). Réservé aux tests. */
export const THEME_TOKENS = {
  light: tokensOf(":root"),
  dark: tokensOf('[data-theme="dark"]'),
} as const;
