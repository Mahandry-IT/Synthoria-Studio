import { describe, expect, it } from "vitest";
import { formatCode } from "./format";

describe("formatCode — code déjà mis en forme", () => {
  it("ne touche pas à un code qui contient un saut de ligne", () => {
    const code = "int main() {\n  int a = 1; int b = 2;\n}";

    expect(formatCode(code)).toBe(code);
  });

  it("ne touche pas à une instruction unique", () => {
    expect(formatCode("nombres.at(1) = 25;")).toBe("nombres.at(1) = 25;");
    expect(formatCode('std::cout << "a; {b}";')).toBe('std::cout << "a; {b}";');
  });

  it("ne touche pas à un littéral JSON ou à un tableau", () => {
    expect(formatCode('{"a": 1, "b": 2}')).toBe('{"a": 1, "b": 2}');
    expect(formatCode('[{"a": 1}, {"b": 2}]')).toBe('[{"a": 1}, {"b": 2}]');
  });

  it("ne touche pas à du code sans `;` ni accolade", () => {
    expect(formatCode("print('bonjour')")).toBe("print('bonjour')");
  });
});

describe("formatCode — code sur une seule ligne", () => {
  it("découpe et indente une classe", () => {
    const code =
      'class Cercle : public Forme { public: void dessiner() const override { std::cout << "Cercle"; } };';

    expect(formatCode(code)).toBe(
      [
        "class Cercle : public Forme {",
        "public:",
        "    void dessiner() const override {",
        '        std::cout << "Cercle";',
        "    }",
        "};",
      ].join("\n"),
    );
  });

  it("découpe un programme complet et garde l'initialiseur sur sa ligne", () => {
    const code =
      "#include <iostream> int main() { int scores[4] = {10, 20, 30, 40}; " +
      "for (int s : scores) { std::cout << s << std::endl; } return 0; }";

    expect(formatCode(code)).toBe(
      [
        "#include <iostream>",
        "int main() {",
        "    int scores[4] = {10, 20, 30, 40};",
        "    for (int s : scores) {",
        "        std::cout << s << std::endl;",
        "    }",
        "    return 0;",
        "}",
      ].join("\n"),
    );
  });

  it("met chaque instruction sur sa ligne", () => {
    expect(formatCode("nombres.push_back(10); nombres.push_back(20); nombres.push_back(30);")).toBe(
      "nombres.push_back(10);\nnombres.push_back(20);\nnombres.push_back(30);",
    );
  });

  it("ne coupe pas les `;` d'un for", () => {
    expect(formatCode("for (int i = 0; i < n; i++) { sum += i; }")).toBe(
      "for (int i = 0; i < n; i++) {\n    sum += i;\n}",
    );
  });

  it("garde `} else {` sur une ligne", () => {
    expect(formatCode("if (x) { a(); } else { b(); }")).toBe(
      "if (x) {\n    a();\n} else {\n    b();\n}",
    );
  });

  it("garde `} while (x);` sur une ligne", () => {
    expect(formatCode("do { a(); } while (x);")).toBe("do {\n    a();\n} while (x);");
  });

  it("garde une lambda dans un appel sur sa ligne", () => {
    expect(
      formatCode("std::sort(v.begin(), v.end(), [](int a, int b) { return a < b; }); std::cout << v[0];"),
    ).toBe("std::sort(v.begin(), v.end(), [](int a, int b) { return a < b; });\nstd::cout << v[0];");
  });

  it("garde une initialisation `v{1, 2, 3}` sur sa ligne", () => {
    expect(formatCode("std::vector<int> v{1, 2, 3}; v.push_back(4);")).toBe(
      "std::vector<int> v{1, 2, 3};\nv.push_back(4);",
    );
  });

  it("indente les membres d'une struct", () => {
    expect(formatCode("struct P { int x; int y; };")).toBe("struct P {\n    int x;\n    int y;\n};");
  });

  it("garde un commentaire de fin de ligne sur sa ligne", () => {
    expect(formatCode("int x = 1; // départ")).toBe("int x = 1; // départ");
    expect(formatCode("int x = 1; int y = 2; // fin")).toBe("int x = 1;\nint y = 2; // fin");
  });

  it("ne casse pas sur un code non fermé", () => {
    expect(formatCode("void f() { int x = 1;")).toBe("void f() {\n    int x = 1;");
    expect(formatCode('std::cout << "abc; int y = 2;')).toBe('std::cout << "abc; int y = 2;');
  });
});
