import "server-only";

// ponytail: in-memory token bucket per instance; move to a shared store (e.g. Upstash) if abuse matters.
const buckets = new Map<string, { tokens: number; at: number }>();

/** Returns true when the caller may proceed. `perMinute` tokens refill continuously. */
export function allow(key: string, perMinute: number): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: perMinute, at: now };
  b.tokens = Math.min(perMinute, b.tokens + ((now - b.at) / 60_000) * perMinute);
  b.at = now;
  const ok = b.tokens >= 1;
  if (ok) b.tokens -= 1;
  buckets.set(key, b);
  return ok;
}

export function clientKey(req: Request, route: string): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return `${route}:${ip}`;
}

export const tooMany = () => Response.json({ status: "error", code: "rate_limited", message: "Too many requests. Wait a minute and try again." }, { status: 429 });
