import { describe, expect, it } from "vitest";
import { maskCode } from "./segments";

describe("maskCode — inline", () => {
  it("masque le code et le sort du texte", () => {
    const { masked, segments } = maskCode("Déclarer : `std::vector<int> nombres;` puis continuer");

    expect(segments.map((s) => s.code)).toEqual(["std::vector<int> nombres;"]);
    expect(masked).not.toContain("`");
    expect(masked).not.toContain(";");
  });

  it("affiche en pastille un identifiant court et en boîte une instruction", () => {
    const { segments } = maskCode(
      "Avec `at()` puis `nombres.at(1) = 25;` et `10 25 30`, terminez par `;`",
    );

    expect(segments.map((s) => [s.code, s.block])).toEqual([
      ["at()", false],
      ["nombres.at(1) = 25;", true],
      ["10 25 30", false],
      [";", false],
    ]);
  });

  it("affiche en boîte un extrait long", () => {
    const [segment] = maskCode(`\`${"a".repeat(61)}\``).segments;

    expect(segment.block).toBe(true);
  });

  it("garde intacts `;`, `|`, `$` et `—` du code", () => {
    const { segments } = maskCode("`a | b $x$ — c;`");

    expect(segments[0].code).toBe("a | b $x$ — c;");
  });

  it("découpe une boîte écrite sur une seule ligne, pas une pastille", () => {
    const { segments } = maskCode("`a(); b();` et `c(d; e)`");

    expect(segments.map((s) => [s.block, s.code])).toEqual([
      [true, "a();\nb();"],
      [true, "c(d; e)"],
    ]);
  });

  it("laisse intacte une boîte dont le corps est déjà sur plusieurs lignes", () => {
    const { segments } = maskCode("```\nint a = 1;\nint b = 2; int c = 3;\n```");

    expect(segments[0].code).toBe("int a = 1;\nint b = 2; int c = 3;");
  });

  it("découpe un bloc ``` dont le corps tient sur une seule ligne", () => {
    const { segments } = maskCode("```cpp\nint a = 1; int b = 2;\n```");

    expect(segments[0].code).toBe("int a = 1;\nint b = 2;");
  });

  it("ne prend pas des accents OCR isolés pour du code", () => {
    const text = "Il va `a la maison et `e la gare";

    const { masked, segments } = maskCode(text);

    expect(segments).toEqual([]);
    expect(masked).toBe(text);
  });

  it("ne traverse pas les sauts de ligne", () => {
    expect(maskCode("`a\nb`").segments).toEqual([]);
  });
});

describe("maskCode — blocs ```", () => {
  it("lit la langue et retire le saut de ligne final", () => {
    const [segment] = maskCode("```cpp\nint x = 1;\nreturn x;\n```").segments;

    expect(segment).toMatchObject({
      code: "int x = 1;\nreturn x;",
      language: "cpp",
      block: true,
    });
  });

  it("accepte un bloc sans langue", () => {
    const [segment] = maskCode("```\nls -la\n```").segments;

    expect(segment).toMatchObject({ code: "ls -la", language: null, block: true });
  });

  it("ne prend pas le premier mot pour une langue quand il n'y a pas de saut de ligne", () => {
    const [segment] = maskCode("```int x;```").segments;

    expect(segment).toMatchObject({ code: "int x;", language: null, block: true });
  });

  it("laisse un bloc non fermé en texte", () => {
    expect(maskCode("```cpp\nint x;").segments).toEqual([]);
  });
});

describe("restore et split", () => {
  const text = "A `x = 1;` B ```js\nlet y;\n``` C";

  it("restore réinjecte le texte d'origine", () => {
    const { masked, restore } = maskCode(text);

    expect(restore(masked)).toBe(text);
  });

  it("split alterne texte et extraits de code, sans morceau vide", () => {
    const { masked, split } = maskCode(text);

    const parts = split(masked);

    expect(parts.map((p) => (typeof p === "string" ? p : p.code))).toEqual([
      "A ",
      "x = 1;",
      " B ",
      "let y;",
      " C",
    ]);
  });

  describe("point après une boîte", () => {
    const parts = (text: string) => {
      const { masked, split } = maskCode(text);
      return split(masked).map((p) => (typeof p === "string" ? p : p.code));
    };

    it("retire le point orphelin qui suit une boîte", () => {
      expect(parts("Trier : `std::sort(v.begin(), v.end());`.")).toEqual([
        "Trier : ",
        "std::sort(v.begin(), v.end());",
      ]);
      expect(parts("`std::sort(a, b);` .")).toEqual(["std::sort(a, b);"]);
    });

    it("retire le point d'un bloc ``` fermé puis ponctué sur sa propre ligne", () => {
      expect(parts("```cpp\nint x;\n```\n.")).toEqual(["int x;"]);
    });

    it("retire le point mais garde la suite de la phrase", () => {
      expect(parts("`a(); b();`. Ensuite, on trie")).toEqual(["a();\nb();", "Ensuite, on trie"]);
    });

    it("retire le point entre deux boîtes", () => {
      expect(parts("`a();`. `b();`")).toEqual(["a();", "b();"]);
    });

    it("garde le point qui suit une pastille : il ferme la phrase", () => {
      expect(parts("Affiche `10 25 30`.")).toEqual(["Affiche ", "10 25 30", "."]);
    });

    it("garde les points de suspension, les décimales et le point dans un mot", () => {
      expect(parts("`a();`... suite")).toEqual(["a();", "... suite"]);
      expect(parts("`a();`.5")).toEqual(["a();", ".5"]);
      expect(parts("`a();`.txt")).toEqual(["a();", ".txt"]);
    });

    it("ne retire que le point qui suit directement la boîte", () => {
      expect(parts("`a();` puis fin.")).toEqual(["a();", " puis fin."]);
    });
  });

  it("split renvoie le texte tel quel s'il n'y a pas de code", () => {
    expect(maskCode("juste du texte").split("juste du texte")).toEqual(["juste du texte"]);
  });
});
