import { describe, expect, it } from "vitest";
import { MarkdownManager } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { mathExtensions } from "@/components/editor/mathExtensions";
import {
  markdownToPlain,
  normalizeEditorMarkdown,
  subtopicsFromMarkdown,
  subtopicsToMarkdown,
} from "./markdown";

// Même chaîne que l'éditeur : Markdown → document Tiptap → Markdown, puis normalisation
const manager = new MarkdownManager({ extensions: [StarterKit, ...mathExtensions] });
const roundTrip = (markdown: string) => normalizeEditorMarkdown(manager.serialize(manager.parse(markdown)));

describe("normalizeEditorMarkdown (aller-retour éditeur)", () => {
  it.each([
    "**gras**, *italique*, ~~barré~~ et `code`",
    "Formule $a_b + c_d$ et $a_b$",
    "$$\nx_{n+1}\n$$",
    String.raw`$\frac{a}{b}$ et $\alpha_1$`,
    String.raw`$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$`,
    String.raw`$$
\sum_{i=1}^{n} \frac{1}{i}
$$`,
    "- énergie $E = mc^2$\n- **note** $a_b$",
    "x_1 et snake_case",
    "a < b > c & d",
    "- un\n- **deux**",
    "1. a\n2. b",
    "```js\nconst a_b = 1 < 2;\n```",
    "premier paragraphe\n\nsecond",
  ])("conserve %j", (markdown) => {
    expect(roundTrip(markdown)).toBe(markdown);
  });

  it("garde l'échappement d'un _ qui ouvrirait une emphase", () => {
    expect(roundTrip(String.raw`\_pas italique\_`)).toBe(String.raw`\_pas italique_`);
  });

  it("document vide → chaîne vide", () => {
    expect(roundTrip("")).toBe("");
  });
});

describe("markdownToPlain", () => {
  it("retire la mise en forme", () => {
    expect(markdownToPlain("**Loi** d'*Ohm* : `U = R * I`\n- a\n- b")).toBe("Loi d'Ohm : U = R * I a b");
  });

  it("laisse intacts snake_case et les formules", () => {
    expect(markdownToPlain("snake_case et $a_b$")).toBe("snake_case et $a_b$");
  });
});

describe("sous-thèmes", () => {
  it("liste → Markdown → liste", () => {
    const topics = ["flux", "**rapport** $a_b$"];
    expect(subtopicsFromMarkdown(subtopicsToMarkdown(topics))).toEqual(topics);
  });

  it("accepte des lignes libres et ignore les lignes vides", () => {
    expect(subtopicsFromMarkdown(" flux \n\n  \n1. rapport\n")).toEqual(["flux", "rapport"]);
  });
});
