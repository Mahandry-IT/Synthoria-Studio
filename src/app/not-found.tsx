import Link from "next/link";

/**
 * Page 404 personnalisée.
 * Affichée automatiquement par Next.js App Router quand aucune route ne correspond.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-7xl font-bold text-indigo-600">404</p>
      <h1 className="mt-4 text-xl font-semibold text-gray-900">
        Page introuvable
      </h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
