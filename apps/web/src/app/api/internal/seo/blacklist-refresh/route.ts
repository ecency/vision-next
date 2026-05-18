/**
 * Internal cron route — refreshes the abuse-blacklist Redis set from the
 * out-of-band community anti-abuse source. Secret-gated, POST-only, Node
 * runtime (fetch + ioredis). Bounded: one timed fetch + chunked Redis writes.
 *
 * Safety:
 *  - Delta-sanity: an implausible size change vs the live set (→0, <50%, >5x)
 *    is rejected — the live key is left untouched (last-good preserved). This
 *    is the durable-snapshot guarantee: a corrupted/hostile upstream can never
 *    mass-noindex or mass-release.
 *  - Atomic swap: build a `:next` set, then RENAME over the live key, so the
 *    live set is never partially written / never empty mid-refresh.
 *  - Never throws to the caller; never mutates the live key on any failure.
 */
import { getSeoRedis, SEO_REDIS_PREFIX } from "@/features/seo/seo-redis";
import { cronAuthorized, notFound } from "@/features/seo/cron-auth";

export const dynamic = "force-dynamic";

const LIVE = `${SEO_REDIS_PREFIX}blacklist:authors`;
const NEXT = `${LIVE}:next`;
const META = `${SEO_REDIS_PREFIX}blacklist:meta`;
const SOURCE = process.env.SEO_BLACKLIST_URL || "";
const FETCH_TIMEOUT_MS = 25_000;
const SADD_CHUNK = 5_000;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export async function POST(req: Request): Promise<Response> {
  if (!cronAuthorized(req)) return notFound();
  if (!SOURCE) return jsonResponse(503, { error: "source-not-configured" });

  const redis = getSeoRedis();
  if (!redis) return jsonResponse(503, { error: "redis-unavailable" });

  const ts = new Date().toISOString();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let parsed: unknown;
    try {
      const res = await fetch(SOURCE, { signal: ctrl.signal });
      if (!res.ok) return jsonResponse(502, { error: `upstream-${res.status}` });
      parsed = JSON.parse(await res.text()); // content-type is text/plain
    } finally {
      clearTimeout(t);
    }

    const result = (parsed as { result?: unknown })?.result;
    if (!Array.isArray(result)) {
      return jsonResponse(502, { error: "unexpected-shape" });
    }
    const accounts = Array.from(
      new Set(result.filter((x): x is string => typeof x === "string" && x.length > 0))
    );
    const newCount = accounts.length;

    const oldCount = (await redis.scard(LIVE)) || 0;
    // Delta-sanity — only enforced once we have an established baseline.
    if (
      oldCount > 0 &&
      (newCount === 0 || newCount < oldCount * 0.5 || newCount > oldCount * 5)
    ) {
      await redis.set(
        META,
        JSON.stringify({ ok: false, reason: "delta-sanity", oldCount, newCount, ts })
      );
      return jsonResponse(200, { skipped: "delta-sanity", oldCount, newCount });
    }

    await redis.del(NEXT);
    for (let i = 0; i < accounts.length; i += SADD_CHUNK) {
      await redis.sadd(NEXT, ...accounts.slice(i, i + SADD_CHUNK));
    }
    // Atomic swap (RENAME also drops the old live set). If `accounts` was
    // empty with no baseline, NEXT doesn't exist → skip rename (stay empty).
    if (newCount > 0) await redis.rename(NEXT, LIVE);
    await redis.set(META, JSON.stringify({ ok: true, count: newCount, ts }));

    return jsonResponse(200, { ok: true, count: newCount, oldCount });
  } catch (e) {
    // Live key untouched (rename only runs on success). Keep last-good.
    return jsonResponse(200, {
      error: "refresh-failed",
      message: e instanceof Error ? e.message : String(e)
    });
  }
}
