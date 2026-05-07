# HTML Edge Caching Architecture

This directory documents the edge caching system for ecency.com.

## Overview

```
┌─────────────────┐
│   Cloudflare    │ ← cf.cacheKey on subfetches; Smart-Tiered-Cache eligible
│   (edge cache)  │
└────────┬────────┘
         ↓
┌─────────────────┐
│  CF Worker      │ ← cache key = URL + auth-class (anon | loggedin)
│  (geo-router)   │   2 cache entries per URL; respects origin Cache-Control
└────────┬────────┘
         ↓
┌─────────────────┐
│     Nginx       │ ← URL-keyed proxy cache, respects origin Cache-Control
│  (proxy cache)  │   (32G LRU, 2h inactive, per-host)
└────────┬────────┘
         ↓
┌─────────────────┐
│    Next.js      │ ← single source of truth; middleware emits Cache-Control
│  (3 regions ×   │   per route pattern, with auth-aware policy
│   4 replicas)   │
└─────────────────┘
```

**Principle:** Next.js decides the cache policy. Nginx and Cloudflare respect
that policy. The CF worker keys cache entries by auth-class so logged-in
users get separate cached responses from anonymous users (one entry each)
without needing a `Vary: Cookie` header.

## Where the policy is defined

- **Route-pattern TTLs**: `apps/web/src/features/next-middleware/cache-policy.ts`
- **Header injection**: `apps/web/src/middleware.ts`
- **User-specific gate**: `isUserSpecificForLoggedIn(policy, isLoggedIn)`
  exported from `cache-policy.ts` — true only when SSR genuinely depends on
  the logged-in user's identity (today: feed tiers via mute filter)

## TTL tiers

Both anonymous and logged-in users share these s-maxage values, EXCEPT for
`feed`, `feed-created`, and `profile-feed` tiers which emit
`private, no-store` for logged-in users (mute filter applied server-side
to feed content; sharing the cache entry across users would leak filtered
content).

| Tier | `s-maxage` | `stale-while-revalidate` | Routes | Cacheable for logged-in? |
|---|---|---|---|---|
| `static` | 24h | 7d | `/faq`, `/about`, `/child-safety`, `/contributors`, `/privacy-policy`, `/terms-of-service`, `/whitepaper`, `/mobile` | yes |
| `home` | 5m | 1h | `/` | n/a (logged-in `/` rewrites to `/@user/feed`) |
| `list` | 5m | 1h | `/discover`, `/communities`, `/witnesses`, `/tags` | yes |
| `list-proposals` | 10m | 1h | `/proposals` | yes |
| `feed` | 1m | 5m | `/hot`, `/trending`, `/payout`, `/muted`, `/promoted` + tags | **no** (mute filter) |
| `feed-created` | 30s | 2m | `/created`, `/tags/:tag` | **no** (mute filter) |
| `community` | 1m | 5m | `/:tag/hive-xxxxx` | yes |
| `profile` | 5m | 1h | `/@author`, `/@author/posts`, `/blog`, `/comments`, `/replies`, `/communities` | yes |
| `profile-feed` | 1m | 5m | `/@author/feed`, `/@author/trail` (aggregates other users' content) | **no** (mute filter) |
| `entry` | 1h | 1d | post pages (default — used until post age is known) | yes |
| `entry-fresh` | 1m | 5m | posts < 1 day old | yes |
| `entry-week` | 1h | 1d | posts 1-7 days old | yes |
| `entry-month` | 1d | 7d | posts 7-30 days old | yes |
| `entry-archive` | 30d | 7d | posts 30-60 days old | yes |
| `entry-ancient` | 30d | 60d | posts > 60 days old | yes |
| `no-cache` | 0 | 0 | `/publish`, `/chats`, `/auth/*`, `/wallet`, `/@author/settings`, `/@author/insights`, etc. | no |

**Empirical basis (2026-05-08):** SSR was tested across 26 page types with
multiple user identities. Routes flagged as cacheable for logged-in produce
byte-equivalent SSR (modulo timestamps in dehydrated React Query state)
across all logged-in users. Routes flagged as not-cacheable read
`active_user` server-side (`feed/[...sections]/page.tsx` for mute filter,
`profile/[username]/insights/page.tsx` for owner-only stats).

**Observability header:** Every response carries `x-cache-tier: <tier>`,
or `<tier>-loggedin` for tiers that are user-specific when logged-in (e.g.
`feed-created-loggedin`). CF analytics, Nginx logs, and browser DevTools
all reveal which policy was applied.

**No `Vary: Cookie`.** Auth bifurcation happens via the CF worker's cache
key, which encodes auth-class (`anon` or `loggedin`) as a synthetic URL
prefix. Two cache entries per URL — one per auth class — without
fragmenting on every cookie (analytics, locale, theme, experiments).

## Layer-specific configuration

- [Nginx](./nginx.md) — proxy cache (32G LRU, 2h inactive)
- [Cloudflare Worker](./cloudflare-worker.md) — auth-class cache key,
  Smart-Tiered-Cache subfetches, per-post-age TTL via origin

## DMCA / moderation invalidation

See [purge script](../../scripts/purge-cache.sh).

**Workflow:**
1. Update `apps/web/public/dmca/dmca-*.json`, commit, deploy
2. Run `./scripts/purge-cache.sh <affected-urls>` to drop pre-DMCA HTML
   from the CF edge cache

Without step 2, CF serves the pre-DMCA HTML until `s-maxage` expires
(up to 1h for post pages, 7d for static pages).

## Per-post-age TTL refinement

For entry (post) pages, the middleware starts with a conservative
`entry-unknown` tier (60s / 5m) when the post's `created` date is not yet
known, then refines it based on the post's age once available:

1. First request for `/cat/@author/permlink` on a given replica: middleware
   sees no cached age → emits `entry-unknown` (60s / 5m) → kicks off a
   background lookup via `event.waitUntil(refreshPostCreatedMs(...))`.
2. Background lookup checks Redis (L2, shared across the host's vision_web
   replicas), then falls back to Hive RPC (`condenser_api.get_content`) if
   Redis missed. Result is stored in both L1 (in-process Map) and Redis.
3. Next request for the same post: L1 hit → middleware emits the refined
   tier (`entry-fresh` through `entry-ancient`).

L2 (Redis) lets the post-age cache survive replica restarts and amortize
RPC fetches across all replicas on the same host. Failures during RPC
(timeout, all nodes failed) are NOT cached — they let the next request
retry — to avoid over-caching a fresh post to the default 1h tier across
the whole region.

See `apps/web/src/features/next-middleware/post-age-cache.ts`.

## Current Status

Implemented in this repo:

- Middleware emits `Cache-Control` and `x-cache-tier` for cacheable HTML routes
- Logged-in users share cache on auth-class-equivalent routes
- Feed tiers + insights stay private when logged-in (server-side
  `active_user` reads detected and excluded)
- Entry-page TTL refined by post age via L1 Map + per-host Redis L2
- `scripts/purge-cache.sh` supports manual DMCA / moderation invalidation

Operated outside this repo:

- Nginx (`ssrcache` zone) on each origin host — see [nginx.md](./nginx.md)
- Cloudflare worker `ecency-geo-router` — see [cloudflare-worker.md](./cloudflare-worker.md)

Before production rollout of changes here, verify `x-cache-tier` values
across route types in staging and confirm the Nginx / Cloudflare layers
are aligned with the origin policy.
