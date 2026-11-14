import { ButtonLink } from "@/components/ButtonLink";

/**
 * Page 404 personnalisée.
 * Affichée automatiquement par Next.js App Router quand aucune route ne correspond.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="num text-8xl text-accent">404</p>
      <h1 className="mt-4 font-serif text-xl font-semibold text-ink">
        Page introuvable
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-2">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <ButtonLink href="/" className="mt-8">
        Retour à l&apos;accueil
      </ButtonLink>
    </div>
  );
}
