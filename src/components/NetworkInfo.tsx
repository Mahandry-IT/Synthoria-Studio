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
    <div className={`rounded-lg border border-gray-200 p-4 ${className}`}>
      {title && (
        <h4 className="text-sm font-semibold text-gray-900 mb-3">{title}</h4>
      )}

      <div className="space-y-3">
        {/* Plage d'adresses IP */}
        {ipRange && (
          <div className="flex items-start gap-2">
            <span className="text-gray-500 text-sm">▶</span>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Adresses utilisables :</span>{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                {formatIPRange(ipRange.start, ipRange.end)}
              </code>
            </div>
          </div>
        )}

        {/* Adresses CIDR */}
        {cidrAddresses.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-gray-500 text-sm">▶</span>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Exemples d'adresses IP :</span>{" "}
              <div className="mt-1 flex flex-wrap gap-2">
                {cidrAddresses.map((cidr) => (
                  <code
                    key={cidr}
                    className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono"
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
          <p className="text-sm text-gray-600 mt-2">{description}</p>
        )}
      </div>
    </div>
  );
}
