"use client";

import { useMemo } from "react";
import type { CourseSource } from "../course.types";
import { LatexText } from "@/shared/utils/latex";

interface SourcesListProps {
  sources: CourseSource[];
}

interface GroupedSource {
  name: string;
  pages: number[];
  type: "file" | "web";
  url?: string | null;
}

/**
 * Extrait le numéro de page depuis une référence (ex: "page 1" → 1).
 */
function extractPageNumber(reference: string): number | null {
  const match = reference.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Formate l'affichage des pages (ex: [1, 2, 8, 13] → "pages 1, 2, 8, 13").
 */
function formatPages(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  if (sorted.length === 1) return `page ${sorted[0]}`;
  return `pages ${sorted.join(", ")}`;
}

/**
 * Groupe les sources par nom de fichier et collecte les numéros de page.
 */
function groupSourcesByName(sources: CourseSource[]): GroupedSource[] {
  const grouped = new Map<string, GroupedSource>();

  for (const source of sources) {
    const name = source.label || source.title || "";
    if (!name) continue;

    if (!grouped.has(name)) {
      grouped.set(name, {
        name,
        pages: [],
        type: source.type,
        url: source.url,
      });
    }

    const group = grouped.get(name)!;
    const detail = source.reference || source.url || "";
    const page = extractPageNumber(detail);

    if (page !== null) {
      group.pages.push(page);
    }
  }

  return Array.from(grouped.values());
}

/**
 * Affiche les sources du cours regroupées par fichier avec leurs pages.
 */
export function SourcesList({ sources }: SourcesListProps) {
  const grouped = useMemo(() => groupSourcesByName(sources), [sources]);

  if (grouped.length === 0) return null;

  return (
    <section aria-labelledby="sources-heading">
      <h2 id="sources-heading" className="text-sm font-semibold text-gray-700 mb-2">
        Sources
      </h2>
      <ul className="space-y-2">
        {grouped.map((source) => (
          <li key={source.name} className="flex items-center gap-2 text-sm text-gray-600">
            {source.type === "file" ? (
              <svg className="h-4 w-4 flex-shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0116 6.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 012 16.5v-13z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 flex-shrink-0 text-blue-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-1.25a.75.75 0 01.75-.75h3.25a.75.75 0 01.75.75v3.25a.75.75 0 01-1.5 0V6.31l-5.47 5.47a.75.75 0 11-1.06-1.06l5.47-5.47H12a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
            )}
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline hover:text-indigo-800"
              >
                {source.name}
              </a>
            ) : (
              <span className="font-medium">{source.name}</span>
            )}
            {source.pages.length > 0 && (
              <span className="text-gray-400">— {formatPages(source.pages)}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
