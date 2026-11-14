"use client";

import { useSyncExternalStore } from "react";
import { formatKickerDate } from "../dashboard.logic";

const subscribe = () => () => {};

/**
 * Date du jour pour le kicker du dashboard. Vide au rendu serveur et à l'hydratation (le fuseau
 * du client n'est pas celui du serveur), puis renseignée côté client sans décalage d'hydratation.
 */
export function useKickerDate(): string {
  return useSyncExternalStore(subscribe, () => formatKickerDate(Date.now()), () => "");
}
