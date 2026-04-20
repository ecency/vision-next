# HTML Edge Caching Architecture

This directory documents the edge caching system for ecency.com.

## Overview

```
┌─────────────────┐
│   Cloudflare    │ ← respects origin Cache-Control, skips cache on active_user cookie
│   (edge cache)  │
└────────┬────────┘
         ↓
┌─────────────────┐
│     Nginx       │ ← respects origin Cache-Control, cookie-aware cache key
│  (proxy cache)  │
└────────┬────────┘
         ↓
┌─────────────────┐
│    Next.js      │ ← single source of truth; middleware emits Cache-Control
│  (3 regions ×   │   per route pattern
│   4 replicas)   │
└─────────────────┘
```

**Principle:** Next.js decides the cache policy. Nginx and Cloudflare respect
that policy.

## Where the policy is defined

- **Route-pattern TTLs**: `apps/web/src/features/next-middleware/cache-policy.ts`
- **Header injection**: `apps/web/src/middleware.ts`
- Cache headers are always emitted by `apps/web/src/middleware.ts`

## TTL tiers (anonymous users only)

Logged-in users (requests with `active_user` cookie) always get
`Cache-Control: private, no-store`.

| Tier | `s-maxage` | `stale-while-revalidate` | Routes |
|---|---|---|---|
| `static` | 24h | 7d | `/faq`, `/about`, `/child-safety`, `/contributors`, `/privacy-policy`, `/terms-of-service`, `/whitepaper`, `/mobile` |
| `home` | 5m | 1h | `/` |
| `list` | 5m | 1h | `/discover`, `/communities`, `/witnesses`, `/tags` |
| `list-proposals` | 10m | 1h | `/proposals` |
| `feed` | 1m | 5m | `/hot`, `/trending`, `/payout`, `/muted`, `/promoted` + tags |
| `feed-created` | 30s | 2m | `/created`, `/tags/:tag` |
| `community` | 1m | 5m | `/:tag/hive-xxxxx` |
| `profile` | 5m | 1h | `/@author`, `/@author/posts`, `/blog`, `/comments`, `/replies`, `/communities`, `/insights` |
| `profile-feed` | 1m | 5m | `/@author/feed`, `/@author/trail` (aggregates other users' content) |
| `entry` | 1h | 1d | post pages (default — used until post age is known) |
| `entry-fresh` | 1m | 5m | posts < 1 day old |
| `entry-week` | 1h | 1d | posts 1-7 days old |
| `entry-month` | 1d | 7d | posts 7-30 days old |
| `entry-archive` | 30d | 7d | posts 30-60 days old |
| `entry-ancient` | 30d | 60d | posts > 60 days old |
| `no-cache` | 0 | 0 | `/publish`, `/chats`, `/auth/*`, `/wallet`, `/@author/settings`, etc. |

**Observability header:** Every response carries `x-cache-tier: <tier>` (or
`logged-in`) so CF analytics, Nginx logs, and browser DevTools all reveal
which policy was applied.

**No `Vary: Cookie`.** Auth bifurcation is done at the infra layer (Nginx
includes `$cookie_active_user` in the cache key; CF worker bypasses cache
when the cookie is present). Emitting `Vary: Cookie` would fragment the
edge cache on every unrelated cookie (analytics, locale, experiments) and
destroy hit ratio.

## Layer-specific configuration

- [Nginx](./nginx.md) — proxy cache alignment, cookie-aware cache key
- [Cloudflare Worker](./cloudflare-worker.md) — edge cache alignment,
  per-post-age TTL refinement

## DMCA / moderation invalidation

See [purge script](../../scripts/purge-cache.sh).

**Workflow:**
1. Update `apps/web/public/dmca/dmca-*.json`, commit, deploy
2. Run `./scripts/purge-cache.sh <affected-urls>` to drop pre-DMCA HTML
   from the CF edge cache

Without step 2, CF serves the pre-DMCA HTML until `s-maxage` expires
(up to 1h for post pages, 7d for static pages).

## Per-post-age TTL refinement

For entry (post) pages, the middleware starts with the conservative `entry`
tier (1h / 1d), then refines it based on the post's age once known:

1. First request for `/cat/@author/permlink`: middleware sees no cached
   age → emits `entry` tier → kicks off a background fetch of the post's
   `created` date via `event.waitUntil(...)`.
2. Background fetch hits `https://api.hive.blog` (condenser_api.get_content),
   parses the `created` timestamp, stores in a module-level LRU cache
   (capped at 2000 entries per edge isolate).
3. Next request for the same post: middleware looks up the cached age
   → emits the refined tier (`entry-fresh` through `entry-ancient`).

The in-memory cache is per edge isolate — different isolates warm up
independently. Failures (timeout, malformed response, missing fields) are
negative-cached for 5 minutes to avoid hammering the upstream on retries.

See `apps/web/src/features/next-middleware/post-age-cache.ts`.

## Current Status

Implemented in this repo:

- Middleware emits `Cache-Control` and `x-cache-tier` for cacheable HTML routes
- Entry-page TTL is refined by post age via the in-memory post-age cache
- `scripts/purge-cache.sh` supports manual DMCA / moderation invalidation

Still required outside this repo:

- Nginx must respect origin `Cache-Control`, vary cache by `active_user`, and expose cache status headers
- The Cloudflare worker must respect origin cache headers for HTML, bypass logged-in traffic, and preserve `x-cache-tier`

Before production rollout, verify `x-cache-tier` values across route types in
staging and confirm the Nginx / Cloudflare layers are aligned with the origin
policy.
