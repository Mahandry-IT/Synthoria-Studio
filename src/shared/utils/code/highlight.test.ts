import { describe, expect, it } from "vitest";
import { highlightCode, type CodeToken } from "./highlight";

const toText = (tokens: CodeToken[]): string =>
  tokens.map((t) => (typeof t === "string" ? t : toText(t.children))).join("");

/** Classes portées par les jetons, à plat. */
const classesOf = (tokens: CodeToken[]): string[] =>
  tokens.flatMap((t) => (typeof t === "string" ? [] : [t.className, ...classesOf(t.children)]));

/** Texte des jetons portant exactement cette classe. */
const textsOf = (tokens: CodeToken[], className: string): string[] =>
  tokens.flatMap((t) =>
    typeof t === "string"
      ? []
      : [...(t.className === className ? [toText(t.children)] : []), ...textsOf(t.children, className)],
  );

const CPP = '#include <iostream>\n\nint main() {\n    std::cout << "Bonjour" << 42 << std::endl; // fin\n    return 0;\n}';

describe("highlightCode", () => {
  it("colore le code avec la langue de l'étiquette", async () => {
    const tokens = await highlightCode(CPP, "cpp");

    expect(tokens).not.toBeNull();
    const classes = classesOf(tokens!);
    expect(classes).toEqual(expect.arrayContaining(["hljs-meta", "hljs-keyword", "hljs-string", "hljs-number", "hljs-comment"]));
    expect(textsOf(tokens!, "hljs-string")).toContain('"Bonjour"');
    expect(textsOf(tokens!, "hljs-number")).toContain("42");
  });

  it("ne modifie jamais le texte : les jetons se recollent en code d'origine", async () => {
    const samples: Array<[string | null, string]> = [
      ["cpp", CPP],
      ["python", "def f(x):\n    return f\"a{x}\"  # <b>&amp;</b>\n"],
      [null, "std::vector<int> v{1, 2, 3}; // <T> & \"q\""],
      ["sql", "SELECT 'a<b' FROM t WHERE x > 1;"],
      ["xml", '<div class="a">&lt;x&gt;</div>'],
      ["cpp", "  \tindenté\n\n\nvide"],
    ];

    for (const [label, code] of samples) {
      const tokens = await highlightCode(code, label);
      expect(tokens && toText(tokens)).toBe(code);
    }
  });

  it("déduit la langue d'un code sans étiquette", async () => {
    const tokens = await highlightCode("std::sort(v.begin(), v.end());", null);

    expect(tokens).not.toBeNull();
    expect(classesOf(tokens!).length).toBeGreaterThan(0);
  });

  it("reconnaît un alias d'étiquette", async () => {
    const tokens = await highlightCode("const a = 1;", "js");

    expect(classesOf(tokens!)).toContain("hljs-keyword");
  });

  it("colore différemment selon la langue", async () => {
    const python = await highlightCode("def f():\n    return None", "python");

    expect(classesOf(python!)).toEqual(expect.arrayContaining(["hljs-keyword", "hljs-title function_", "hljs-literal"]));
  });

  it("rend null pour un texte brut, une étiquette « text » ou un code sans indice", async () => {
    expect(await highlightCode("Bonjour le monde !", null)).toBeNull();
    expect(await highlightCode("int x = 1;", "text")).toBeNull();
    expect(await highlightCode("10 25 30", "output")).toBeNull();
  });

  it("rend null au-delà de la taille maximale", async () => {
    expect(await highlightCode("int x = 1;\n".repeat(3_000), "cpp")).toBeNull();
  });

  it("charge chaque langue une seule fois et reste utilisable en parallèle", async () => {
    const results = await Promise.all([
      highlightCode("int a;", "cpp"),
      highlightCode("int b;", "cpp"),
      highlightCode("SELECT 1 FROM t;", "sql"),
    ]);

    expect(results.every((tokens) => tokens !== null)).toBe(true);
  });
});
