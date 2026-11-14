"use client";

/**
 * Données de comparaison PostgreSQL vs MySQL (InnoDB).
 */
export interface ComparisonRow {
  criterion: string;
  postgresql: string;
  mysql: string;
}

const DEFAULT_ROWS: ComparisonRow[] = [
  {
    criterion: "Architecture",
    postgresql: "Multi-processus (Process Backend)",
    mysql: "Multi-thread (Thread per connection)",
  },
  {
    criterion: "Conformité SQL",
    postgresql: "Très élevée (SQL:2016)",
    mysql: "Modérée / Bonne (MySQL 8)",
  },
  {
    criterion: "Types complexes",
    postgresql: "JSONB, Arrays, Ranges, Custom",
    mysql: "JSON",
  },
  {
    criterion: "Indexation",
    postgresql: "B-Tree, GIN, GiST, BRIN, SP-GiST",
    mysql: "B-Tree, Spatial, Full-Text",
  },
  {
    criterion: "Extensibilité",
    postgresql: "Excellente (PostGIS, pgvector)",
    mysql: "Limitée (Plugins de stockage)",
  },
  {
    criterion: "Pool de connexions",
    postgresql: "Recommandé / Indispensable (PgBouncer)",
    mysql: "Optionnel à charge moyenne",
  },
];

interface ComparisonTableProps {
  title?: string;
  rows?: ComparisonRow[];
  className?: string;
}

/**
 * Tableau comparatif réutilisable pour comparer deux technologies.
 * Par défaut : PostgreSQL vs MySQL (InnoDB).
 */
export function ComparisonTable({
  title = "Comparaison PostgreSQL vs MySQL (InnoDB)",
  rows = DEFAULT_ROWS,
  className = "",
}: ComparisonTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      {title && (
        <h3 className="font-serif text-lg font-semibold text-ink mb-4">{title}</h3>
      )}
      <table className="min-w-full divide-y divide-line border border-line rounded-card overflow-hidden">
        <thead className="bg-sunken">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-sm font-semibold text-ink"
            >
              Critère
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-sm font-semibold text-ink"
            >
              PostgreSQL
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-sm font-semibold text-ink"
            >
              MySQL (InnoDB)
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-surface">
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className={idx % 2 === 0 ? "bg-surface" : "bg-sunken/50"}
            >
              <td className="px-4 py-3 text-sm font-medium text-ink whitespace-nowrap">
                {row.criterion}
              </td>
              <td className="px-4 py-3 text-sm text-ink-2">
                {row.postgresql}
              </td>
              <td className="px-4 py-3 text-sm text-ink-2">
                {row.mysql}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
