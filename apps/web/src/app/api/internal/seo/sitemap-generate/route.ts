/**
 * Internal cron route — regenerates the precomputed sitemap blobs in Redis
 * (read by the public /sitemap.xml + /sitemap/[shard] route handlers).
 * Secret-gated, POST-only, Node runtime. Reuses the *exact* in-process
 * isIndexable/canonicalTarget (single source of truth by construction).
 *
 * Bounded by design — never a corpus scan / never crashes a replica:
 *  - Hard wall-clock budget + max page cap on the `created` feed walk.
 *  - Window: only the last ~48h of top-level posts (a freshness sitemap).
 *  - Per-RPC try/catch: a failed page ends the walk and serves what we have.
 *  - Blacklist read fresh from Redis so just-flagged authors are excluded.
 *  - rep-gate is intentionally skipped here (accountFetchFailed=true): we
 *    don't fetch a profile per post (no fan-out); SSR still applies it on
 *    crawl, so a listed-but-rep-gated post is at worst a wasted hint.
 */
import { getSeoRedis, SEO_REDIS_PREFIX } from "@/features/seo/seo-redis";
import { cronAuthorized, notFound } from "@/features/seo/cron-auth";
import { isIndexable, canonicalTarget } from "@/utils/entry-indexability";
import { Entry } from "@/entities";
import defaults from "@/defaults";
import { callRPC } from "@ecency/sdk";

export const dynamic = "force-dynamic";

const BASE = defaults.base;
const LIVE_BL = `${SEO_REDIS_PREFIX}blacklist:authors`;
const K = (s: string) => `${SEO_REDIS_PREFIX}sitemap:${s}`;
const TIME_BUDGET_MS = 50_000;
const MAX_PAGES = 60; // ~6000 posts cap
const WINDOW_MS = 48 * 60 * 60_000;
const PAGE = 100;

const esc = (s: string) =>
  s.replace(/[&<>'"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" })[c]!
  );

const urlset = (urls: { loc: string; lastmod?: string }[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      (u) =>
        `<url><loc>${esc(u.loc)}</loc>` +
        (u.lastmod ? `<lastmod>${esc(u.lastmod)}</lastmod>` : "") +
        `</url>`
    )
    .join("\n") +
  `\n</urlset>\n`;

const indexXml = (children: { name: string; lastmod: string }[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  children
    .map(
      (c) =>
        `<sitemap><loc>${esc(`${BASE}/sitemap/${c.name}`)}</loc>` +
        `<lastmod>${esc(c.lastmod)}</lastmod></sitemap>`
    )
    .join("\n") +
  `\n</sitemapindex>\n`;

function normalize(p: Record<string, unknown>): Entry {
  const e = p as unknown as Entry;
  if (typeof e.json_metadata === "string") {
    try {
      e.json_metadata = JSON.parse(e.json_metadata);
    } catch {
      e.json_metadata = null;
    }
  }
  return e;
}

export async function POST(req: Request): Promise<Response> {
  if (!cronAuthorized(req)) return notFound();
  const redis = getSeoRedis();
  if (!redis) {
    return new Response(JSON.stringify({ error: "redis-unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }

  const started = Date.now();
  const cutoff = started - WINDOW_MS;
  let blacklist: ReadonlySet<string>;
  try {
    blacklist = new Set(await redis.smembers(LIVE_BL));
  } catch {
    blacklist = new Set();
  }

  const seen = new Set<string>();
  const postUrls: { loc: string; lastmod?: string }[] = [];
  const authors = new Set<string>();
  let startAuthor: string | undefined;
  let startPermlink: string | undefined;
  let pages = 0;
  let reachedCutoff = false;

  while (pages < MAX_PAGES && Date.now() - started < TIME_BUDGET_MS && !reachedCutoff) {
    let batch: Record<string, unknown>[];
    try {
      batch = (await callRPC("bridge.get_ranked_posts", {
        sort: "created",
        tag: "",
        observer: "",
        limit: PAGE,
        start_author: startAuthor ?? "",
        start_permlink: startPermlink ?? ""
      })) as Record<string, unknown>[];
    } catch {
      break; // serve what we have
    }
    if (!Array.isArray(batch) || batch.length === 0) break;
    pages += 1;

    for (const raw of batch) {
      const e = normalize(raw);
      const id = `${e.author}/${e.permlink}`;
      if (seen.has(id)) continue; // pagination overlaps by the cursor item
      seen.add(id);
      startAuthor = e.author;
      startPermlink = e.permlink;
      if (e.created && Date.parse(`${e.created}Z`) < cutoff) {
        reachedCutoff = true;
        break;
      }
      if (!isIndexable(e, null, true, blacklist)) continue;
      const loc = canonicalTarget(e, BASE);
      if (!loc) continue;
      postUrls.push({ loc, lastmod: (e.updated || e.created || "").slice(0, 10) });
      if (e.author) authors.add(e.author);
    }
  }

  const nowDay = new Date().toISOString().slice(0, 10);
  const staticUrls = [
    { loc: `${BASE}/`, lastmod: nowDay },
    { loc: `${BASE}/discover`, lastmod: nowDay },
    { loc: `${BASE}/communities`, lastmod: nowDay }
  ];
  const authorUrls = Array.from(authors).map((a) => ({
    loc: `${BASE}/@${a}`,
    lastmod: nowDay
  }));

  try {
    await redis.set(K("posts-1.xml"), urlset(postUrls));
    await redis.set(K("authors.xml"), urlset(authorUrls));
    await redis.set(K("static.xml"), urlset(staticUrls));
    await redis.set(
      K("index"),
      indexXml([
        { name: "posts-1.xml", lastmod: nowDay },
        { name: "authors.xml", lastmod: nowDay },
        { name: "static.xml", lastmod: nowDay }
      ])
    );
    await redis.set(
      `${SEO_REDIS_PREFIX}sitemap:meta`,
      JSON.stringify({
        ts: new Date().toISOString(),
        posts: postUrls.length,
        authors: authorUrls.length,
        pages,
        ms: Date.now() - started,
        reachedCutoff
      })
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "write-failed", message: e instanceof Error ? e.message : String(e) }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      posts: postUrls.length,
      authors: authorUrls.length,
      pages,
      ms: Date.now() - started,
      reachedCutoff
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
