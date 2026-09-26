import axios, { type AxiosRequestConfig, type AxiosError } from "axios";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 10_000;
const DEFAULT_TIMEOUT_MS = 60_000;

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Instance axios préconfigurée pour le proxy Next.js */
const api = axios.create({
  baseURL: "/api",
  timeout: DEFAULT_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldRetry(status: number): boolean {
  return status >= 500 || !status;
}

function toHttpError(err: AxiosError): HttpError {
  const status = err.response?.status ?? 0;
  const body = err.response?.data ?? null;
  return new HttpError(status, `HTTP ${status}`, body);
}

/**
 * Wrapper axios avec timeout, retry backoff exponentiel sur 5xx/réseau.
 * Ne retry PAS sur erreurs 4xx.
 * Passer `noRetry: true` pour un appel unique (ex: génération de cours).
 */
export async function httpClient<T>(
  path: string,
  config: AxiosRequestConfig & { noRetry?: boolean } = {},
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT_MS, noRetry = false, ...rest } = config;
  const maxAttempts = noRetry ? 1 : MAX_RETRIES + 1;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await api.request<T>({ ...rest, url: path, timeout });
      return res.data;
    } catch (err) {
      if (!axios.isAxiosError(err)) {
        throw err;
      }

      const httpErr = toHttpError(err);

      // HttpError 4xx → throw immédiat (pas de retry)
      if (httpErr.status >= 400 && httpErr.status < 500) {
        throw httpErr;
      }

      lastError = httpErr;

      if (!shouldRetry(httpErr.status)) {
        throw httpErr;
      }
    }

    if (attempt < maxAttempts - 1) {
      const delay = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
      await sleep(delay);
    }
  }

  throw lastError ?? new Error("Request failed after retries");
}

/** POST JSON helper */
export function postJson<T>(path: string, body: unknown, config?: AxiosRequestConfig & { noRetry?: boolean }): Promise<T> {
  return httpClient<T>(path, {
    method: "POST",
    data: body,
    headers: { "Content-Type": "application/json" },
    ...config,
  });
}

/** GET helper */
export function getJson<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  return httpClient<T>(path, { method: "GET", ...config });
}

/** PUT JSON helper */
export function putJson<T>(path: string, body: unknown, config?: AxiosRequestConfig & { noRetry?: boolean }): Promise<T> {
  return httpClient<T>(path, {
    method: "PUT",
    data: body,
    headers: { "Content-Type": "application/json" },
    ...config,
  });
}

/**
 * DELETE helper. Sans retry : une suppression n'est pas sûre à rejouer après un 5xx ambigu
 * (le 1er appel a pu aboutir côté serveur ; un retry renverrait alors un 404 trompeur).
 */
export function deleteJson<T = void>(path: string, config?: AxiosRequestConfig & { noRetry?: boolean }): Promise<T> {
  return httpClient<T>(path, { method: "DELETE", noRetry: true, ...config });
}

/**
 * POST multipart helper (pour l'upload de fichiers).
 * Sans retry : l'ingestion n'est pas idempotente (un retry après un 5xx
 * renverrait « File already uploaded » si le 1er appel a abouti côté serveur).
 */
export function postMultipart<T>(path: string, formData: FormData): Promise<T> {
  return httpClient<T>(path, {
    method: "POST",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
    noRetry: true,
  });
}
