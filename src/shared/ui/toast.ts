import { toast } from "react-toastify";

import { resolveErrorMessage } from "@/shared/api/errors";

/** Toast erreur — fermeture auto après 6 s */
export function toastError(err: unknown): void {
  toast.error(resolveErrorMessage(err), { autoClose: 6_000 });
}

/** Toast succès — fermeture auto après 4 s */
export function toastSuccess(message: string): void {
  toast.success(message, { autoClose: 4_000 });
}

/** Toast warning — fermeture auto après 5 s */
export function toastWarning(message: string): void {
  toast.warning(message, { autoClose: 5_000 });
}
