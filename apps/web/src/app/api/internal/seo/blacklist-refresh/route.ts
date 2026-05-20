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
import { randomUUID } from "crypto";
import { getSeoRedis, SEO_REDIS_PREFIX } from "@/features/seo/seo-redis";
import { cronAuthorized, notFound } from "@/features/seo/cron-auth";

export const dynamic = "force-dynamic";

interface ParsedResult {
  result?: unknown;
}

const LIVE = `${SEO_REDIS_PREFIX}blacklist:authors`;
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

  // Per-request temp key: this endpoint is externally triggerable, so two
  // overlapping calls must not interleave del/sadd/rename on a shared key
  // and swap a half-built set over LIVE. The finally drops it on every
  // path (success already renamed it away; skip/failure leave no orphan).
  const NEXT = `${LIVE}:next:${randomUUID()}`;
  const ts = new Date().toISOString();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let parsed: unknown;
    try {
      const res = await fetch(SOURCE, { signal: ctrl.signal });
      if (!res.ok) return jsonResponse(502, { error: `upstream-${res.status}` });
      const text = await res.text(); // content-type is text/plain
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = undefined; // not JSON → unexpected-shape below
      }
    } finally {
      clearTimeout(t);
    }

    // Strict by design. The SEO blacklist is specifically the spaminator
    // *spam* list ({"result":[...]}). Other Hive "blacklists" — e.g. the
    // Watchmen badactors.txt *security/phishing* feed — are a different
    // thing and must NOT be silently ingested as an SEO spam filter. A
    // shape mismatch means SEO_BLACKLIST_URL points at the wrong feed, so
    // fail loud (502 + META) instead of polluting noindex/sitemap data.
    const result = (parsed as ParsedResult)?.result;
    if (!Array.isArray(result)) {
      try {
        await redis.set(META, JSON.stringify({ ok: false, reason: "unexpected-shape", ts }));
      } catch {
        /* best-effort failure record */
      }
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
    // Live key untouched (rename only runs on success) — last-good preserved.
    // But this IS a failure: return 5xx (not 200) so the caller/monitoring
    // sees it, and record it in META. 200 is reserved for success and the
    // intentional delta-sanity skip; 502/503 cover upstream/redis already.
    const message = e instanceof Error ? e.message : String(e);
    console.error("[seo/blacklist-refresh] failed:", e);
    try {
      // Internal META record keeps message for operator debugging via redis-cli;
      // response body intentionally omits it to avoid leaking internals.
      await redis.set(META, JSON.stringify({ ok: false, reason: "refresh-failed", message, ts }));
    } catch {
      /* best-effort failure record */
    }
    return jsonResponse(500, { error: "refresh-failed" });
  } finally {
    // Drop the temp key on every path: on success rename() already moved
    // it to LIVE (no-op del); on skip/error this clears any partial set.
    try {
      await redis.del(NEXT);
    } catch {
      /* best-effort cleanup */
    }
  }
}
