import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AskStepper } from "@/features/course/components/AskStepper";
import { ButtonLink } from "./ButtonLink";
import { EmptyState } from "./EmptyState";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("h1 serif, kicker et description seulement si fournis", () => {
    const withAll = renderToStaticMarkup(h(PageHeader, { kicker: "12 cours", title: "Historique", description: "Texte" }));
    expect(withAll).toContain("<h1");
    expect(withAll).toContain("kicker");
    expect(withAll).toContain("Texte");
    const bare = renderToStaticMarkup(h(PageHeader, { title: "Historique" }));
    expect(bare).not.toContain("kicker");
  });
});

describe("EmptyState", () => {
  it("titre, action et classe de l'appelant (aucune marge imposée)", () => {
    const out = renderToStaticMarkup(
      h(EmptyState, { title: "Rien ici", action: h("button", null, "Agir"), className: "mt-4" }),
    );
    expect(out).toContain("Rien ici");
    expect(out).toContain("Agir");
    expect(out).toContain("mt-4");
    expect(renderToStaticMarkup(h(EmptyState, { title: "x" }))).not.toContain("mt-4");
  });
});

describe("ButtonLink", () => {
  it("lien avec cible de 44 px et variante", () => {
    const out = renderToStaticMarkup(h(ButtonLink, { href: "/ask", variant: "accent" }, "Nouveau cours"));
    expect(out).toContain('href="/ask"');
    expect(out).toContain("min-h-11");
    expect(out).toContain("Nouveau cours");
  });
});

describe("AskStepper", () => {
  it("étape courante annoncée", () => {
    const out = renderToStaticMarkup(h(AskStepper, { step: 2 }));
    expect(out).toContain("Étape 2 sur 3");
    expect(out).toContain('aria-current="step"');
  });
});
