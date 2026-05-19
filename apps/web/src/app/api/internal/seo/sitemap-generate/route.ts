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
// The community *list* changes slowly → re-fetch via list_communities at most
// weekly (names cached in Redis). The shard is still rebuilt every run from
// the cached names + fresh post-derived lastmod, so freshness stays hourly
// while the ~5 list_communities RPCs run only ~weekly.
const COMM_REFRESH_MS = 7 * 24 * 60 * 60_000;
const COMM_NAMES_KEY = `${SEO_REDIS_PREFIX}sitemap:communities:names`;
const COMM_BUILT_KEY = `${SEO_REDIS_PREFIX}sitemap:communities:builtAt`;
// Last accepted post count — the baseline for the stale-preserving guard so a
// budget/error-truncated walk can't overwrite a good posts/authors sitemap.
const POSTS_LASTGOOD_KEY = `${SEO_REDIS_PREFIX}sitemap:posts:lastgood`;
// This is a background bulk paginated walk, not an interactive call: be more
// patient than the SDK's UI defaults (5s / retry 1 = only 2 nodes) so a
// momentarily slow/sick node fails over across more of the node list per page
// instead of bleeding the time budget. Worst case is bounded by TIME_BUDGET_MS
// (checked each iteration) + the seocron curl --max-time.
const RPC_TIMEOUT_MS = 8_000;
const RPC_RETRY = 4; // up to 5 nodes tried per page

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

  // Community name list — changes slowly, so refresh it from list_communities
  // at most weekly and cache the names in Redis. Every run still rebuilds the
  // communities shard (below) from these names + the post-derived lastmod, so
  // freshness stays hourly while the ~5 list_communities RPCs run only weekly.
  let communityNames: string[] = [];
  try {
    const [builtAt, cached] = await Promise.all([
      redis.get(COMM_BUILT_KEY),
      redis.get(COMM_NAMES_KEY)
    ]);
    if (cached) {
      const arr: unknown = JSON.parse(cached);
      if (Array.isArray(arr)) {
        // Re-screen on every load: a code-side NSFW_COMMUNITIES addition
        // must take effect on the next run, not only when the weekly cache
        // expires. (The response `is_nsfw` bonus signal can't be re-applied
        // here — names only — but the curated set is the source of truth.)
        communityNames = arr.filter(
          (x): x is string =>
            typeof x === "string" && /^hive-\d+$/.test(x) && !isNsfwCommunity(x)
        );
      }
    }
    const fresh =
      communityNames.length > 0 &&
      !!builtAt &&
      Date.now() - Date.parse(builtAt) < COMM_REFRESH_MS;
    if (!fresh) {
      const prevCount = communityNames.length; // screened cached baseline
      const fetched: string[] = [];
      const seenComm = new Set<string>();
      let commLast = "";
      let aborted = false; // an RPC error mid-pagination → likely truncated
      for (let cp = 0; cp < COMM_PAGES; cp++) {
        let cbatch: Record<string, unknown>[];
        try {
          cbatch = (await callRPC(
            "bridge.list_communities",
            { sort: "rank", limit: COMM_LIMIT, last: commLast },
            RPC_TIMEOUT_MS,
            RPC_RETRY
          )) as Record<string, unknown>[];
        } catch {
          aborted = true;
          break;
        }
        if (!Array.isArray(cbatch) || cbatch.length === 0) break;
        for (const c of cbatch) {
          const name = typeof c.name === "string" ? c.name : "";
          if (!name || seenComm.has(name)) continue;
          seenComm.add(name);
          commLast = name;
          // Defensive: only the verified self-canonical /created/hive-NNN
          // form. Hive community accounts are always hive-<digits>; guard is
          // after the cursor advance so a freak value can't stall pagination.
          if (!/^hive-\d+$/.test(name)) continue;
          if (isNsfwCommunity(name) || c.is_nsfw === true) continue;
          fetched.push(name);
        }
        if (cbatch.length < COMM_LIMIT) break;
      }
      // Stale-preserving sanity (mirrors the blacklist delta-sanity): only
      // adopt/recache a fetch that completed without an RPC abort and isn't
      // implausibly smaller than the baseline. A truncated/partial fetch
      // (page-2+ RPC error) or a >50% shrink is rejected — keep the cached
      // (time-stale but complete) names and DON'T recache, so the weekly
      // refresh keeps retrying instead of persisting a bad list for a week.
      const sane =
        fetched.length > 0 &&
        !aborted &&
        (prevCount === 0 || fetched.length >= prevCount * 0.5);
      if (sane) {
        communityNames = fetched;
        try {
          await redis.set(COMM_NAMES_KEY, JSON.stringify(fetched));
          await redis.set(COMM_BUILT_KEY, new Date().toISOString());
        } catch {
          /* best-effort cache; in-memory names still used this run */
        }
      }
    }
  } catch {
    /* Redis read failed — communityNames stays []; shard just omits them */
  }

  const seen = new Set<string>();
  const postUrls: SitemapUrl[] = [];
  const authors = new Set<string>();
  // community id -> newest post day (YYYY-MM-DD) seen in the freshness
  // window. Free: derived from the post walk below, no extra RPC.
  const communityLatest = new Map<string, string>();
  let startAuthor: string | undefined;
  let startPermlink: string | undefined;
  let pages = 0;
  let reachedCutoff = false;

  while (pages < MAX_PAGES && Date.now() - started < TIME_BUDGET_MS && !reachedCutoff) {
    let batch: Record<string, unknown>[];
    try {
      batch = (await callRPC(
        "bridge.get_ranked_posts",
        {
          sort: "created",
          tag: "",
          observer: "",
          limit: PAGE,
          start_author: startAuthor ?? "",
          start_permlink: startPermlink ?? ""
        },
        RPC_TIMEOUT_MS,
        RPC_RETRY
      )) as Record<string, unknown>[];
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
      // Community freshness (free, from this walk): newest post day per
      // community, before the indexable filter — a new post makes the hub
      // fresh even if that post itself is rep-gated/non-indexable.
      const comm = typeof raw.community === "string" ? raw.community : "";
      if (comm) {
        const day = (e.updated || e.created || "").slice(0, 10);
        const prev = communityLatest.get(comm);
        if (day && (!prev || day > prev)) communityLatest.set(comm, day);
      }
      if (!isIndexable(e, null, true, blacklist)) continue;
      const loc = canonicalTarget(e, BASE);
      if (!loc) continue;
      postUrls.push({ loc, lastmod: (e.updated || e.created || "").slice(0, 10) });
      if (e.author) authors.add(e.author);
    }
  }

  const nowDay = new Date().toISOString().slice(0, 10);
  // Hub pages whose listed content changes daily → lastmod = today.
  // Info/legal pages rarely change → no lastmod (honest: don't claim a
  // daily change). All verified on prod: 200, not noindex, no
  // canonical-away. /market excluded (307 → /market/swap). /waves
  // excluded: a volatile microblog feed with no stable landing value —
  // its substantive content is already covered by posts.xml (depth-1
  // container/wave items passing the wave quality gate).
  const hubPaths = ["", "discover", "communities", "witnesses", "proposals", "tags"];
  const infoPaths = [
    "about",
    "faq",
    "perks",
    "mobile",
    "contributors",
    "whitepaper",
    "privacy-policy",
    "terms-of-service",
    "child-safety"
  ];
  const staticUrls: SitemapUrl[] = [
    ...hubPaths.map((p) => ({ loc: p ? `${BASE}/${p}` : `${BASE}/`, lastmod: nowDay })),
    ...infoPaths.map((p) => ({ loc: `${BASE}/${p}` }))
  ];
  const authorUrls = Array.from(authors).map((a) => ({
    loc: `${BASE}/@${a}`,
    lastmod: nowDay
  }));
  // Cached/weekly name list + free hourly post-derived lastmod. A community
  // with no post in the freshness window simply omits lastmod (honest: it
  // signals staleness by absence rather than a fabricated date).
  const communityUrls: SitemapUrl[] = communityNames.map((name) => {
    const lastmod = communityLatest.get(name);
    return lastmod
      ? { loc: `${BASE}/created/${name}`, lastmod }
      : { loc: `${BASE}/created/${name}` };
  });

  // Stale-preserving guard (mirrors the blacklist/communities delta-sanity):
  // a budget- or error-truncated walk must NOT overwrite a good posts/authors
  // sitemap. Accept iff the walk completed (reachedCutoff — authoritative even
  // in a quiet period), there's no baseline yet, or it's within 50% of the
  // last accepted count. On reject, posts.xml + authors.xml keep their
  // last-good blobs; the independent communities/static/index still refresh.
  let lastGood = 0;
  try {
    lastGood = parseInt((await redis.get(POSTS_LASTGOOD_KEY)) ?? "", 10) || 0;
  } catch {
    lastGood = 0;
  }
  const acceptWalk =
    reachedCutoff || lastGood === 0 || postUrls.length >= Math.floor(lastGood * 0.5);
  const WALK_DERIVED = new Set<string>(["posts.xml", "authors.xml"]);

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
      if (!acceptWalk && WALK_DERIVED.has(name)) continue; // keep last-good
      await redis.set(K(name), shardXml[name]);
    }
    await redis.set(
      K("index"),
      indexXml(SITEMAP_SHARDS.map((name) => ({ name, lastmod: nowDay })))
    );
    if (acceptWalk) {
      await redis.set(POSTS_LASTGOOD_KEY, String(postUrls.length));
    }
    await redis.set(
      `${SEO_REDIS_PREFIX}sitemap:meta`,
      JSON.stringify({
        ts: new Date().toISOString(),
        posts: postUrls.length,
        authors: authorUrls.length,
        communities: communityUrls.length,
        pages,
        ms: Date.now() - started,
        reachedCutoff,
        acceptedWalk: acceptWalk,
        lastGood
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
      reachedCutoff,
      acceptedWalk: acceptWalk,
      lastGood
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
