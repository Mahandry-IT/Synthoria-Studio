import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReviewBoxes } from "./ReviewBoxes";

describe("ReviewBoxes", () => {
  it("marque seulement la boîte courante (aria-current) et affiche les effectifs", () => {
    const cards = [{ box: 0 }, { box: 1 }, { box: 1 }, { box: 3 }];
    const out = renderToStaticMarkup(h(ReviewBoxes, { cards, currentBox: 1 }));
    expect(out.match(/aria-current="true"/g)).toHaveLength(1);
    expect(out).toContain("(carte actuelle)");
    expect(out).toContain("Boîte J+3 : 2 cartes dans cette série");
    expect(out).toContain("Dans cette série");
  });
});
