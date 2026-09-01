// Rate limiter en memoria (ventana fija por IP). Suficiente para un MVP
// single-instance; si se escala horizontal, migrar a Upstash Redis.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Limpieza periódica para no filtrar memoria.
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
    lastCleanup = now;
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSec: 0 };
}

/** IP del cliente considerando proxies comunes (Vercel/Cloudflare/Nginx). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Respuesta 429 estándar con header Retry-After. */
export function tooManyRequests(retryAfterSec: number): Response {
  return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Probá de nuevo en un rato." }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(Math.max(1, retryAfterSec)) },
  });
}
