"use client";

import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Input, Select } from "@/components/Input";

export const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Taille de page courante ; avec `onPageSizeChange`, affiche le sélecteur « N / page ». */
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
}

/** Numéros affichés : tous si peu de pages, sinon première, dernière et voisines de la page courante. */
function visiblePages(page: number, totalPages: number): (number | "ellipsis-start" | "ellipsis-end")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const start = Math.max(2, Math.min(page - 1, totalPages - 4));
  const end = Math.min(totalPages - 1, Math.max(page + 1, 5));
  const items: (number | "ellipsis-start" | "ellipsis-end")[] = [1];
  if (start > 2) items.push("ellipsis-start");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push("ellipsis-end");
  items.push(totalPages);
  return items;
}

const navButton =
  "flex h-11 w-11 items-center justify-center rounded-ctrl text-ink transition-colors hover:bg-sunken " +
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent motion-reduce:transition-none";

/**
 * Pagination commune : précédent / numéros / suivant, sélecteur de taille de page (optionnel)
 * et saisie directe d'une page (« Aller à »). Cibles de 44 px, page courante en `primary`.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: PaginationProps) {
  const [goTo, setGoTo] = useState("");
  const canChangeSize = pageSize !== undefined && onPageSizeChange !== undefined;
  const sizes = canChangeSize && !pageSizeOptions.includes(pageSize) ? [...pageSizeOptions, pageSize].sort((a, b) => a - b) : pageSizeOptions;

  // Rien à paginer : on masque (sauf si la taille de page peut encore être réduite)
  if (totalPages <= 1 && !(canChangeSize && pageSize > Math.min(...sizes))) return null;

  function submitGoTo() {
    const target = Number.parseInt(goTo, 10);
    setGoTo("");
    if (Number.isNaN(target)) return;
    onPageChange(Math.min(totalPages, Math.max(1, target)));
  }

  return (
    <nav aria-label="Pagination" className="flex justify-center pt-4">
      <div className="flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-card border border-line bg-surface px-3 py-1.5 text-sm text-ink shadow-paper">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={navButton}
            aria-label="Page précédente"
          >
            <ChevronLeftIcon fontSize="small" />
          </button>

          {visiblePages(page, totalPages).map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={`flex h-11 min-w-11 items-center justify-center rounded-ctrl px-2 text-sm transition-colors motion-reduce:transition-none ${
                  item === page ? "bg-primary font-semibold text-primary-ink" : "text-ink hover:bg-sunken"
                }`}
              >
                {item}
              </button>
            ) : (
              <span key={item} aria-hidden="true" className="px-1 text-ink-3">
                …
              </span>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={navButton}
            aria-label="Page suivante"
          >
            <ChevronRightIcon fontSize="small" />
          </button>
        </div>

        {canChangeSize && (
          <Select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Éléments par page"
            fullWidth={false}
          >
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </Select>
        )}

        <label className="flex items-center gap-2 text-ink-2">
          Aller à
          <Input
            type="number"
            min={1}
            max={totalPages}
            inputMode="numeric"
            value={goTo}
            onChange={(e) => setGoTo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitGoTo();
            }}
            onBlur={submitGoTo}
            aria-label={`Aller à la page (1 à ${totalPages})`}
            fullWidth={false}
            className="w-20 px-2 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          Page
        </label>
      </div>
    </nav>
  );
}
