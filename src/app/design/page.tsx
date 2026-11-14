import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignShowcase } from "./DesignShowcase";

export const metadata: Metadata = { title: "Design (interne)", robots: { index: false, follow: false } };
// Évalué à la requête : la garde de production ne doit pas être figée au build.
export const dynamic = "force-dynamic";

/** Page interne de vérification visuelle des composants partagés. Introuvable en production. */
export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DesignShowcase />;
}
