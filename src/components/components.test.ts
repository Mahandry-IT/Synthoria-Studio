import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BADGE_ALIASES, Badge } from "./Badge";
import { Button } from "./Button";
import { Card } from "./Card";
import { Check, Option } from "./Check";
import { CircularProgressRing } from "./CircularProgressRing";
import { ConfirmDialog } from "./ConfirmDialog";
import { Input, Select, Textarea } from "./Input";
import { LoadingModal } from "./LoadingModal";
import { Modal } from "./Modal";
import { ProgressBar } from "./ProgressBar";
import { Stepper } from "./Stepper";

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("Button", () => {
  it.each([
    ["primary", "bg-primary"],
    ["accent", "bg-accent"],
    ["secondary", "border-line-strong"],
    ["outline", "border-line-strong"],
    ["ghost", "text-primary"],
    ["danger", "bg-err"],
  ] as const)("variante %s", (variant, cls) => {
    expect(html(h(Button, { variant }, "x"))).toContain(cls);
  });
  it("défaut primary, cible de 44 px, désactivé en loading", () => {
    const out = html(h(Button, { loading: true }, "x"));
    expect(out).toContain("bg-primary");
    expect(out).toContain("min-h-11");
    expect(out).toContain("disabled");
  });
  it("taille icône 44 × 44 avec aria-label", () => {
    const out = html(h(Button, { size: "icon", "aria-label": "Fermer" }, "x"));
    expect(out).toContain("h-11 w-11");
    expect(out).toContain('aria-label="Fermer"');
  });
});

describe("Badge", () => {
  it.each(Object.entries(BADGE_ALIASES))("alias %s → ton %s", (legacy, tone) => {
    const aliased = html(h(Badge, { variant: legacy as keyof typeof BADGE_ALIASES }, "x"));
    expect(aliased).toBe(html(h(Badge, { variant: tone }, "x")));
  });
  it("accepte une variante issue d'une map dynamique", () => {
    const map: Record<string, "indigo" | "green" | "amber" | "gray" | "red"> = { a: "indigo", b: "red" };
    expect(html(h(Badge, { variant: map.b }, "x"))).toContain("bg-err-soft");
  });
  it("utilise rounded-tag et neutral par défaut", () => {
    const out = html(h(Badge, null, "x"));
    expect(out).toContain("rounded-tag");
    expect(out).toContain("text-ink-2");
  });
});

describe("Card", () => {
  it("applique les tokens, et hover n'ajoute pas « false »", () => {
    const out = html(h(Card, null, "x"));
    expect(out).toContain("bg-surface");
    expect(out).toContain("shadow-paper");
    expect(out).not.toContain("false");
    expect(html(h(Card, { hover: true }, "x"))).toContain("hover:shadow-lift");
  });
});

describe("Input", () => {
  it("associe libellé, aide et erreur", () => {
    const out = html(h(Input, { id: "t", label: "Titre", help: "Aide", error: "Faux" }));
    expect(out).toContain('for="t"');
    expect(out).toContain('aria-describedby="t-help t-error"');
    expect(out).toContain('aria-invalid="true"');
    expect(out).toContain('role="alert"');
  });
  it("rend le contrôle seul sans libellé ni message", () => {
    const out = html(h(Input, { "aria-label": "Page" }));
    expect(out.startsWith("<input")).toBe(true);
    expect(out).not.toContain('aria-invalid="');
  });
  it("variantes textarea et select natives", () => {
    expect(html(h(Textarea, { label: "N" }))).toContain("<textarea");
    expect(html(h(Select, { label: "N" }, h("option", null, "a")))).toContain("<select");
  });
});

describe("Check", () => {
  it("garde type=checkbox et type=radio natifs", () => {
    expect(html(h(Check, { label: "a" }))).toContain('type="checkbox"');
    expect(html(h(Check, { label: "a", type: "radio" }))).toContain('type="radio"');
    expect(html(h(Option, { label: "a" }))).toContain('type="radio"');
  });
});

describe("ProgressBar", () => {
  it("expose les valeurs ARIA bornées", () => {
    const out = html(h(ProgressBar, { value: 140, label: "Envoi" }));
    expect(out).toContain('role="progressbar"');
    expect(out).toContain('aria-valuenow="100"');
    expect(out).toContain('aria-valuemin="0"');
    expect(out).toContain('aria-label="Envoi"');
  });
  it("est indéterminée sans valeur", () => {
    expect(html(h(ProgressBar, { label: "x" }))).not.toContain("aria-valuenow");
  });
});

describe("Stepper", () => {
  it("marque l'étape courante et annonce chaque état", () => {
    const out = html(h(Stepper, { total: 3, current: 2, label: "Parcours" }));
    expect(out.match(/aria-current="step"/g)).toHaveLength(1);
    expect(out).toContain("Étape 1 sur 3 : terminée");
    expect(out).toContain("Étape 2 sur 3 : en cours");
    expect(out).toContain("Étape 3 sur 3 : à venir");
  });
  it("`complete` : tous les segments terminés, aucune étape courante", () => {
    const out = html(h(Stepper, { total: 3, current: 3, label: "Parcours", complete: true }));
    expect(out).not.toContain("aria-current");
    expect(out.match(/: terminée/g)).toHaveLength(3);
    expect(out).not.toContain("en cours");
  });
});

describe("Modal, ConfirmDialog, LoadingModal", () => {
  it("Modal : rôle dialog et labelledby fourni", () => {
    const out = html(h(Modal, { onClose: () => {}, labelledBy: "t", children: "x" }));
    expect(out).toContain('role="dialog"');
    expect(out).toContain('aria-labelledby="t"');
    expect(out).toContain("bg-veil");
  });
  it("ConfirmDialog garde son id de titre", () => {
    const out = html(h(ConfirmDialog, { title: "T", description: "D", onConfirm: () => {}, onClose: () => {} }));
    expect(out).toContain('aria-labelledby="confirm-dialog-title"');
    expect(out).toContain('id="confirm-dialog-title"');
  });
  it("LoadingModal garde ses ids et son rôle", () => {
    const out = html(h(LoadingModal, { open: true, title: "T", message: "M", icon: null }));
    expect(out).toContain('role="alertdialog"');
    expect(out).toContain('id="loading-modal-title"');
    expect(out).toContain('id="loading-modal-message"');
    expect(html(h(LoadingModal, { open: false, title: "T", message: "M", icon: null }))).toBe("");
  });
});

describe("CircularProgressRing", () => {
  it("couleurs par défaut sur tokens et rôles conservés", () => {
    const out = html(h(CircularProgressRing, { value: 0.5, label: "L" }));
    expect(out).toContain("var(--primary)");
    expect(out).not.toMatch(/#[0-9a-f]{6}/i);
    expect(out).toContain('role="progressbar"');
    expect(out).toContain('aria-valuenow="50"');
    expect(html(h(CircularProgressRing, { value: 0.5, label: "L", role: "timer" }))).not.toContain("aria-valuenow");
  });
});
