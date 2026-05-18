/**
 * Internal cron route — regenerates the precomputed sitemap blobs in Redis
 * (read by the public /sitemap.xml + /sitemap/[shard] route handlers).
 * Secret-gated, POST-only, Node runtime. Reuses the *exact* in-process
 * isIndexable/canonicalTarget (single source of truth by construction).
 *
 * Bounded by design — never a corpus scan / never crashes a replica:
 *  - Hard wall-clock budget + max page cap on the `created` feed walk.
 *  - A rolling freshness set of the most-recent posts, regenerated hourly —
 *    bounded by whichever hits first: the ~48h cutoff, MAX_PAGES, or the
 *    time budget. In busy periods MAX_PAGES binds before 48h; that's fine
 *    (hourly regen keeps the head fresh — it's a discovery hint, not a
 *    complete archive).
 *  - Per-RPC try/catch: a failed page ends the walk and serves what we have.
 *  - Blacklist read fresh from Redis so just-flagged authors are excluded.
 *  - rep-gate is intentionally skipped here (accountFetchFailed=true): we
 *    don't fetch a profile per post (no fan-out); SSR still applies it on
 *    crawl, so a listed-but-rep-gated post is at worst a wasted hint.
 */
import { getSeoRedis, SEO_REDIS_PREFIX } from "@/features/seo/seo-redis";
import { cronAuthorized, notFound } from "@/features/seo/cron-auth";
import { SITEMAP_SHARDS } from "@/features/seo/sitemap-shards";
import { isIndexable, canonicalTarget } from "@/utils/entry-indexability";
import { isNsfwCommunity } from "@/utils/nsfw-detection";
import { Entry } from "@/entities";
import defaults from "@/defaults";
// Hive-only entry: this is a server route handler — avoid pulling the
// React/react-query surface of the main SDK entry into it.
import { callRPC } from "@ecency/sdk/hive";

export const dynamic = "force-dynamic";

const BASE = defaults.base;
const LIVE_BL = `${SEO_REDIS_PREFIX}blacklist:authors`;
const K = (s: string) => `${SEO_REDIS_PREFIX}sitemap:${s}`;
const TIME_BUDGET_MS = 50_000;
// bridge.get_ranked_posts hard-caps `limit` at 20 — the RPC *rejects*
// anything higher with "limit = N outside valid range [1:20]" (confirmed
// against api.hive.blog; see packages/render-helper/scan-post-corpus.mjs).
// Walk paginates via start_author/start_permlink. 150 pages * 20 ≈ 3000
// most-recent posts, comfortably inside TIME_BUDGET_MS at ~0.2–0.3s/RPC.
const MAX_PAGES = 150;
const WINDOW_MS = 48 * 60 * 60_000;
const PAGE = 20;
// Communities: a small, stable hub set (not a freshness walk). list_communities
// caps at 100/page → 5 pages ≈ top ~500 by rank. Cheap, independent of the
// post-walk time budget.
const COMM_PAGES = 5;
const COMM_LIMIT = 100;

interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

const esc = (s: string) =>
  s.replace(/[&<>'"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" })[c]!
  );

const urlset = (urls: SitemapUrl[]) =>
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

  // Communities hub shard — bounded, resilient, independent of the post walk.
  // /created/hive-NNN is 200 + self-canonical (/trending|/hot canonical TO
  // it), so it's a safe indexable target. NSFW excluded via our curated set
  // (single source of truth); the response `is_nsfw` flag is unreliable so
  // it's only an additive bonus signal, never relied upon.
  const communityUrls: SitemapUrl[] = [];
  const seenComm = new Set<string>();
  let commLast = "";
  for (let cp = 0; cp < COMM_PAGES; cp++) {
    let cbatch: Record<string, unknown>[];
    try {
      cbatch = (await callRPC("bridge.list_communities", {
        sort: "rank",
        limit: COMM_LIMIT,
        last: commLast
      })) as Record<string, unknown>[];
    } catch {
      break;
    }
    if (!Array.isArray(cbatch) || cbatch.length === 0) break;
    for (const c of cbatch) {
      const name = typeof c.name === "string" ? c.name : "";
      if (!name || seenComm.has(name)) continue;
      seenComm.add(name);
      commLast = name;
      // Defensive: only emit the verified self-canonical /created/hive-NNN
      // form. Hive community accounts are always hive-<digits>; the guard is
      // after the cursor advance so a freak value can't stall pagination.
      if (!/^hive-\d+$/.test(name)) continue;
      if (isNsfwCommunity(name) || c.is_nsfw === true) continue;
      communityUrls.push({ loc: `${BASE}/created/${name}` });
    }
    if (cbatch.length < COMM_LIMIT) break;
  }

  const seen = new Set<string>();
  const postUrls: SitemapUrl[] = [];
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

  // Writer/index/route stay in lockstep: every shard we emit — and every
  // child the index points at — comes from the single shared SITEMAP_SHARDS
  // allowlist the public route validates against. A name here that isn't in
  // that list is a compile error (keyof typeof), not a silent prod 404.
  const shardXml: Record<(typeof SITEMAP_SHARDS)[number], string> = {
    "posts.xml": urlset(postUrls),
    "authors.xml": urlset(authorUrls),
    "communities.xml": urlset(communityUrls),
    "static.xml": urlset(staticUrls)
  };

  try {
    for (const name of SITEMAP_SHARDS) {
      await redis.set(K(name), shardXml[name]);
    }
    await redis.set(
      K("index"),
      indexXml(SITEMAP_SHARDS.map((name) => ({ name, lastmod: nowDay })))
    );
    await redis.set(
      `${SEO_REDIS_PREFIX}sitemap:meta`,
      JSON.stringify({
        ts: new Date().toISOString(),
        posts: postUrls.length,
        authors: authorUrls.length,
        communities: communityUrls.length,
        pages,
        ms: Date.now() - started,
        reachedCutoff
      })
    );
  } catch (e) {
    // 500 (not 200): the deploy-time prime keys its retry/break on a 2xx
    // here, and monitoring must see a write failure rather than a false ok.
    return new Response(
      JSON.stringify({ error: "write-failed", message: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      posts: postUrls.length,
      authors: authorUrls.length,
      communities: communityUrls.length,
      pages,
      ms: Date.now() - started,
      reachedCutoff
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
