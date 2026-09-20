"use client";

import { useEffect, useState } from "react";

/** Horloge : `Date.now()` rafraîchi toutes les `intervalMs` (compte à rebours, dates relatives). */
export function useNow(intervalMs: number = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
