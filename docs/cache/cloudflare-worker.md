# Cloudflare Worker Cache Alignment

Changes required in the production CF worker to respect origin Cache-Control
headers for HTML and enable aggressive edge caching.

## Required changes

### 1. Respect origin Cache-Control for HTML

Currently the worker caches non-HTML (static assets) and passes HTML through.
After this change, HTML is cached per origin's `Cache-Control` header.

```js
export default {
  async fetch(request, env, ctx) {
    // Bypass cache entirely for logged-in users
    const cookieHeader = request.headers.get("Cookie") || "";
    const isLoggedIn = /(^|;\s*)active_user=/.test(cookieHeader);
    if (isLoggedIn) {
      return fetch(request);
    }

    // Skip cache for non-GET
    if (request.method !== "GET") {
      return fetch(request);
    }

    // Normalize cache key — strip query params we don't want to split cache on
    // (optional: preserves pagination params, drops analytics noise)
    const cacheKey = new Request(request.url, request);

    const cache = caches.default;
    let response = await cache.match(cacheKey);

    if (!response) {
      response = await fetch(request);

      // Only cache successful responses with a cacheable Cache-Control
      if (response.status === 200 && isCacheable(response)) {
        // Clone so we can stash it while still returning to client
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
    }

    return response;
  }
};

function isCacheable(response) {
  const cc = response.headers.get("Cache-Control") || "";
  // Honor private/no-store/no-cache from origin
  if (/\b(private|no-store|no-cache)\b/i.test(cc)) return false;
  // Only cache when origin explicitly asks us to
  return /\bs-maxage=\d+/i.test(cc) || /\bmax-age=\d+/i.test(cc);
}
```

### 2. Enable Tiered Cache / Argo

With 3 origins (EU/US/SG), enable **Tiered Cache** so regional edges
consolidate misses before hitting origin. This dramatically reduces origin
load during viral traffic bursts.

Dashboard: Caching → Tiered Cache → Enable

### 3. Per-post-age TTL refinement — already implemented in middleware

The Next.js middleware now refines entry-page TTL based on post age via a
background-populated in-memory cache
(`apps/web/src/features/next-middleware/post-age-cache.ts`). First request
for a post gets the default `entry` tier; subsequent requests get the
refined tier based on the post's `created` date.

The CF worker does **not** need to fetch post metadata — it just respects
the `Cache-Control` header emitted by middleware, which already encodes
the age-based TTL.

**Tier table (for reference / CF-side refinement if ever needed):**

| Post age | `s-maxage` | `stale-while-revalidate` |
|---|---|---|
| < 1d | 60s | 300s |
| 1-7d | 1h | 1d |
| 7-30d | 1d | 7d |
| 30-60d | 30d | 7d |
| > 60d | 30d | 60d |

**Implementation sketch:**

```js
// On cache miss for entry page URLs, fetch post metadata from Hive API
// and compute a tighter or looser TTL than what origin sent.

async function refineEntryPageTTL(request, response, env) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/(?:[^/]+\/)?@([^/]+)\/([^/]+)/);
  if (!match) return response;

  const [, author, permlink] = match;
  const post = await getPostMetadata(author, permlink, env); // long-cached in KV
  if (!post?.created) return response;

  const ageMs = Date.now() - new Date(post.created + "Z").getTime();
  const ageDays = ageMs / 86400000;

  let sMaxAge, swr;
  if (ageDays < 1)      { sMaxAge = 60;       swr = 300; }
  else if (ageDays < 7) { sMaxAge = 3600;     swr = 86400; }
  else if (ageDays < 30){ sMaxAge = 86400;    swr = 604800; }
  else if (ageDays < 60){ sMaxAge = 2592000;  swr = 604800; }
  else                  { sMaxAge = 2592000;  swr = 5184000; }

  const cloned = new Response(response.body, response);
  cloned.headers.set(
    "Cache-Control",
    `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`
  );
  return cloned;
}

async function getPostMetadata(author, permlink, env) {
  const key = `post:${author}/${permlink}`;
  const cached = await env.POST_META_KV.get(key, "json");
  if (cached) return cached;

  // Fetch minimal metadata from Hive condenser API
  const res = await fetch("https://api.hive.blog", {
    method: "POST",
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "condenser_api.get_content",
      params: [author, permlink],
      id: 1
    })
  });
  const data = await res.json();
  const post = { created: data.result?.created };

  // Created date is immutable — cache aggressively
  await env.POST_META_KV.put(key, JSON.stringify(post), {
    expirationTtl: 604800
  });
  return post;
}
```

Requires KV binding `POST_META_KV`.

### 4. Observability

Add cache status to response headers:

```js
response.headers.set("CF-Cache-Status", hit ? "HIT" : "MISS");
// Preserve x-cache-tier from origin — lets us analyze hit ratio per tier
```

## Verification

```bash
# First request — MISS
curl -sI https://ecency.com/discover | grep -iE 'cf-cache|tier|cache-control'

# Second request — HIT (from CF)
curl -sI https://ecency.com/discover | grep -iE 'cf-cache|tier'

# Logged-in bypass
curl -sI --cookie "active_user=alice" https://ecency.com/discover | grep -iE 'cf-cache|cache-control'
```

## Rollout

1. Deploy worker with HTML caching + cookie bypass but without per-post-age
   refinement. Verify hit ratio climbs on entry pages.
2. Add KV binding and deploy per-post-age refinement.
3. Monitor origin RPS — expect 70-90% reduction on anonymous traffic.
