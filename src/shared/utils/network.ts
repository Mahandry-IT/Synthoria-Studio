/**
 * Utilitaires de formatage pour les adresses réseau.
 */

/**
 * Formate une plage d'adresses IP.
 * @param start - Adresse IP de début (ex: "192.168.1.1")
 * @param end - Adresse IP de fin (ex: "192.168.1.254")
 * @returns Chaîne formatée (ex: "192.168.1.1 à 192.168.1.254")
 *
 * @example
 * formatIPRange("192.168.1.1", "192.168.1.254")
 * // → "192.168.1.1 à 192.168.1.254"
 */
export function formatIPRange(start: string, end: string): string {
  return `${start} à ${end}`;
}

/**
 * Formate une adresse CIDR.
 * @param cidr - Adresse CIDR (ex: "2001:0db8::/32")
 * @returns Chaîne formatée (ex: "2001:0db8::/32")
 *
 * @example
 * formatCIDR("2001:0db8::/32")
 * // → "2001:0db8::/32"
 */
export function formatCIDR(cidr: string): string {
  return cidr;
}

/**
 * Formate une adresse IPv4 avec masque.
 * @param ip - Adresse IP (ex: "192.168.1.0")
 * @param mask - Masque de sous-réseau (ex: "255.255.255.0")
 * @returns Chaîne formatée (ex: "192.168.1.0/24")
 */
export function formatIPv4WithMask(ip: string, mask: string): string {
  const prefix = maskToPrefix(mask);
  return `${ip}/${prefix}`;
}

/**
 * Convertit un masque de sous-réseau en préfixe CIDR.
 * @param mask - Masque (ex: "255.255.255.0")
 * @returns Nombre de bits de préfixe (ex: 24)
 */
function maskToPrefix(mask: string): number {
  const parts = mask.split(".").map(Number);
  let prefix = 0;
  for (const part of parts) {
    prefix += part.toString(2).split("1").length - 1;
  }
  return prefix;
}

/**
 * Valide si une chaîne est une adresse IPv4 valide.
 * @param ip - Chaîne à valider
 * @returns true si l'adresse est valide
 */
export function isValidIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = Number(part);
    return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part;
  });
}

/**
 * Valide si une chaîne est une adresse IPv6 valide (simplifié).
 * @param ip - Chaîne à valider
 * @returns true si l'adresse est valide
 */
export function isValidIPv6(ip: string): boolean {
  // Validation simplifiée pour IPv6
  const parts = ip.split(":");
  if (parts.length > 8) return false;
  return parts.every((part) => {
    if (part === "") return true;
    return /^[0-9a-fA-F]{1,4}$/.test(part);
  });
}
