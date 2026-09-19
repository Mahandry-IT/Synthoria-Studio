import { describe, expect, it } from "vitest";
import { guessLanguage, resolveLanguage } from "./language";

describe("guessLanguage", () => {
  const cases: Array<[label: string, code: string, expected: string | null]> = [
    ["cpp : programme complet", '#include <iostream>\n\nint main() {\n    std::cout << "Bonjour" << std::endl;\n    return 0;\n}', "cpp"],
    ["cpp : classe", 'class Cercle : public Forme {\npublic:\n    void dessiner() const override {\n        std::cout << "Cercle";\n    }\n};', "cpp"],
    ["cpp : appel std::", "std::sort(v.begin(), v.end());", "cpp"],
    ["cpp : push_back", "nombres.push_back(10);", "cpp"],
    ["cpp : instruction sans indice (famille C)", "nombres.at(1) = 25;", "cpp"],
    ["c : stdio", '#include <stdio.h>\n\nint main() {\n    printf("hi");\n    return 0;\n}', "c"],
    ["java", 'public static void main(String[] args) {\n    System.out.println("Hi");\n}', "java"],
    ["csharp", 'Console.WriteLine("Hi");', "csharp"],
    ["python : fonction", "def f(x):\n    return x * 2\n\nprint(f(3))", "python"],
    ["python : boucle", "for i in range(10):\n    print(i)", "python"],
    ["python : import", "import os\nfrom math import sqrt", "python"],
    ["javascript", "const a = [1, 2, 3].map((x) => x * 2);\nconsole.log(a);", "javascript"],
    ["javascript : fonction", "function add(a, b) {\n  return a + b;\n}", "javascript"],
    ["sql", "SELECT name FROM users WHERE age > 18;", "sql"],
    ["sql : minuscules", "insert into t (a) values (1);", "sql"],
    ["bash : commande", "ls -la | grep foo", "bash"],
    ["bash : prompt", "$ npm install lowlight", "bash"],
    ["bash : compilation", "g++ main.cpp -o main", "bash"],
    ["json", '{"a": 1, "b": [true, null]}', "json"],
    ["html", '<div class="a">Hello</div>', "xml"],
    ["css", ".a { color: red; margin: 0 }", "css"],
    ["php", "<?php echo $x; ?>", "php"],
    ["go", 'package main\n\nfunc main() {\n    fmt.Println("hi")\n}', "go"],
    ["rust", 'fn main() {\n    println!("hi");\n}', "rust"],
    ["kotlin", 'fun main() {\n    val x = 1\n}', "kotlin"],
    ["sortie de programme : mots", "Bonjour le monde !", null],
    ["sortie de programme : nombres", "10 25 30", null],
    ["sortie de programme : lignes", "Cercle\nCarré\nTriangle", null],
    ["un simple appel de fonction", "print(x)", null],
  ];

  it.each(cases)("%s", (_label, code, expected) => {
    expect(guessLanguage(code)).toBe(expected);
  });

  it("ne prend pas une classe C++ à modificateur pour du CSS", () => {
    expect(guessLanguage("class A { public: int x; };")).toBe("cpp");
  });

  it("ne prend pas un tableau JS pour du JSON invalide", () => {
    expect(guessLanguage("[1, 2, 3,]")).not.toBe("json");
  });
});

describe("resolveLanguage", () => {
  it("utilise l'étiquette du bloc quand elle est connue", () => {
    expect(resolveLanguage("cpp", "n'importe quoi")).toBe("cpp");
    expect(resolveLanguage("Python", "x")).toBe("python");
  });

  it("résout les alias courants", () => {
    expect(resolveLanguage("c++", "")).toBe("cpp");
    expect(resolveLanguage("js", "")).toBe("javascript");
    expect(resolveLanguage("sh", "")).toBe("bash");
    expect(resolveLanguage("html", "")).toBe("xml");
    expect(resolveLanguage("c#", "")).toBe("csharp");
  });

  it("n'applique aucune couleur aux étiquettes de texte brut", () => {
    expect(resolveLanguage("text", "int x = 1;")).toBeNull();
    expect(resolveLanguage("output", "std::cout")).toBeNull();
  });

  it("déduit le langage d'une étiquette inconnue ou absente", () => {
    expect(resolveLanguage("arduino", "std::sort(a, b);")).toBe("cpp");
    expect(resolveLanguage(null, "SELECT a FROM t;")).toBe("sql");
    expect(resolveLanguage(null, "Bonjour")).toBeNull();
  });
});
