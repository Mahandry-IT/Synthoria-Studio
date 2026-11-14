"use client";

import { formatIPRange, formatCIDR } from "@/shared/utils/network";

/**
 * Informations sur une plage d'adresses réseau.
 */
export interface NetworkRange {
  /** Adresse IP de début */
  start: string;
  /** Adresse IP de fin */
  end: string;
}

/**
 * Informations sur un réseau.
 */
export interface NetworkInfoProps {
  /** Titre de la section */
  title?: string;
  /** Plage d'adresses IP utilisables */
  ipRange?: NetworkRange;
  /** Adresses CIDR */
  cidrAddresses?: string[];
  /** Description supplémentaire */
  description?: string;
  /** Classe CSS supplémentaire */
  className?: string;
}

/**
 * Composant pour afficher les informations réseau (plages d'adresses, CIDR).
 *
 * @example
 * <NetworkInfo
 *   title="Adresses utilisables pour les hôtes"
 *   ipRange={{ start: "192.168.1.1", end: "192.168.1.254" }}
 *   cidrAddresses={["2001:0db8::/32"]}
 * />
 */
export function NetworkInfo({
  title = "Adresses utilisables pour les hôtes",
  ipRange,
  cidrAddresses = [],
  description,
  className = "",
}: NetworkInfoProps) {
  return (
    <div className={`rounded-card border border-line bg-surface p-4 ${className}`}>
      {title && (
        <h4 className="text-sm font-semibold text-ink mb-3">{title}</h4>
      )}

      <div className="space-y-3">
        {/* Plage d'adresses IP */}
        {ipRange && (
          <div className="flex items-start gap-2">
            <span className="text-ink-3 text-sm">▶</span>
            <div className="text-sm text-ink-2">
              <span className="font-medium">Adresses utilisables :</span>{" "}
              <code className="bg-sunken px-1.5 py-0.5 rounded text-xs font-mono text-ink">
                {formatIPRange(ipRange.start, ipRange.end)}
              </code>
            </div>
          </div>
        )}

        {/* Adresses CIDR */}
        {cidrAddresses.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-ink-3 text-sm">▶</span>
            <div className="text-sm text-ink-2">
              <span className="font-medium">Exemples d&apos;adresses IP :</span>{" "}
              <div className="mt-1 flex flex-wrap gap-2">
                {cidrAddresses.map((cidr) => (
                  <code
                    key={cidr}
                    className="bg-sunken px-1.5 py-0.5 rounded text-xs font-mono text-ink"
                  >
                    {formatCIDR(cidr)}
                  </code>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Description supplémentaire */}
        {description && (
          <p className="text-sm text-ink-2 mt-2">{description}</p>
        )}
      </div>
    </div>
  );
}
