import "server-only";
import type { z } from "zod";
import { YoucamError, extractErrorCode } from "./errors";

const TIMEOUT_MS = 20_000;
const RETRIES = 2;

function config() {
  const key = process.env.YOUCAM_API_KEY;
  if (!key) throw new YoucamError("missing_api_key", 500, "YOUCAM_API_KEY is not set");
  return { key, base: process.env.YOUCAM_BASE_URL ?? "https://yce-api-01.makeupar.com" };
}

export const isConfigured = () => Boolean(process.env.YOUCAM_API_KEY);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Authenticated JSON call; retries network errors and 5xx with backoff, validates with Zod. */
export async function youcamJson<S extends z.ZodType>(path: string, schema: S, init: RequestInit = {}): Promise<z.infer<S>> {
  const { key, base } = config();
  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt) await sleep(400 * 2 ** attempt);
    try {
      const res = await fetch(base + path, {
        ...init,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init.headers },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      const body: unknown = await res.json().catch(() => null);
      if (res.status >= 500) {
        lastErr = new YoucamError(extractErrorCode(body), res.status);
        continue;
      }
      if (!res.ok) throw new YoucamError(extractErrorCode(body), res.status, `YouCam ${res.status} on ${path}`);
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        // Log the shape, never the payload (it can contain signed mask URLs).
        console.error("YouCam response shape mismatch", path, parsed.error.issues.slice(0, 3));
        throw new YoucamError("unexpected_response", 502);
      }
      return parsed.data;
    } catch (e) {
      if (e instanceof YoucamError && e.status < 500) throw e;
      lastErr = e;
    }
  }
  throw lastErr instanceof YoucamError ? lastErr : new YoucamError("network_error", 502, String(lastErr));
}
