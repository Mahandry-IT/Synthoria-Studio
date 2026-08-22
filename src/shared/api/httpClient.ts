const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldRetry(status: number, error?: Error): boolean {
  if (error?.name === "AbortError") return false;
  if (error?.name === "TimeoutError") return false;
  return status >= 500 || !status; // network errors have status 0
}

/**
 * Wrapper fetch avec timeout, retry backoff exponentiel sur 5xx/réseau.
 * Ne retry PAS sur erreurs 4xx.
 */
export async function httpClient<T>(
  path: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  const url = `${API_URL}${path}`;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...fetchOptions,
        signal: AbortSignal.timeout(timeout),
        headers: {
          ...fetchOptions.headers,
        },
      });

      if (!res.ok) {
        let body: unknown;
        try {
          body = await res.json();
        } catch {
          body = await res.text().catch(() => null);
        }

        if (shouldRetry(res.status)) {
          lastError = new HttpError(res.status, `HTTP ${res.status}`, body);
        } else {
          throw new HttpError(res.status, `HTTP ${res.status}`, body);
        }
      } else {
        const text = await res.text();
        if (!text) return undefined as T;
        return JSON.parse(text) as T;
      }
    } catch (err) {
      if (err instanceof HttpError && !shouldRetry(0, err)) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
      if (!shouldRetry(0, lastError)) {
        throw lastError;
      }
    }

    if (attempt < MAX_RETRIES) {
      const delay = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
      await sleep(delay);
    }
  }

  throw lastError ?? new Error("Request failed after retries");
}

/** POST JSON helper */
export function postJson<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  return httpClient<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

/** GET helper */
export function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  return httpClient<T>(path, { method: "GET", ...init });
}

/** POST multipart helper (pour l'upload de fichiers) */
export async function postMultipart<T>(path: string, formData: FormData): Promise<T> {
  return httpClient<T>(path, {
    method: "POST",
    body: formData,
    // Ne pas définir Content-Type — le navigateur le fait automatiquement avec le boundary
  });
}
