# Nginx Cache Alignment

Nginx (`ssrcache` zone) sits between the CF worker and vision_web. It runs
on each origin server (eu/us/asia.ecency.com). Because the worker has
already keyed on auth-class and only forwards cacheable requests, **nginx
does NOT need to gate on `active_user` cookie itself** — origin's
`Cache-Control` is the source of truth.

## Cache zone

```nginx
proxy_cache_path /var/cache/nginx/ssr levels=1:2
                 keys_zone=ssrcache:200m
                 max_size=32g
                 inactive=2h;
```

- `keys_zone=200m` — supports ~1.6M keys (~125 bytes each)
- `max_size=32g` — total disk; LRU evicts beyond this
- `inactive=2h` — entries not accessed in 2 hours are evicted regardless of
  s-maxage. Picked as a compromise between honoring the policy intent (some
  tiers want 30d) and bounding edit-staleness for long-tail content. A
  separate `last_update`-based invalidation system would be required to
  honor full s-maxage safely.

## Per-host config

```nginx
server {
  listen 80;
  server_name eu.ecency.com;  # or us / asia per host

  location / {
    proxy_cache                  ssrcache;
    proxy_cache_key              "$request_uri";
    # Defer to origin Cache-Control. Fallback for responses without it.
    proxy_cache_valid            200 0;
    proxy_cache_valid            any 30s;
    # Stale-while-revalidate semantics
    proxy_cache_use_stale        updating error timeout http_500 http_502 http_503 http_504;
    proxy_cache_background_update on;
    proxy_cache_lock             on;
    proxy_cache_lock_timeout     5s;

    # Observability
    add_header X-Cache-Status $upstream_cache_status always;
    add_header X-Cache-Tier   $upstream_http_x_cache_tier always;

    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 5s;
    proxy_send_timeout    20s;
    proxy_read_timeout    20s;
  }
}
```

## Why no cookie in cache key

The CF worker keys on `https://cache.internal/<authClass><path><query>`
where `authClass` ∈ `{anon, loggedin}`. Nginx is downstream of the worker
and never sees both auth classes — the worker has already split traffic.
Including `$cookie_active_user` in the nginx cache key would just create a
3rd-level fragmentation that doesn't help.

For the rare case of nginx being hit directly (e.g. internal monitoring,
direct origin access bypassing CF), the response is still safe because
origin's middleware emits the right Cache-Control regardless of how the
request arrived.

## Verification

Hit nginx directly (its listen port, with the right `Host:` header) to
isolate the nginx + middleware layers from CF. Going through port 3000
would bypass nginx and exercise only the upstream Next.js process —
useful for middleware-only checks but won't show `X-Cache-Status`.
Browser sessions remain the right way to verify the full edge stack
end-to-end.

```bash
# Anon post page — second request should HIT in nginx ssrcache
curl -sI -H "Host: ecency.com" \
  "http://127.0.0.1/<community>/<author>/<permlink>" | grep -iE 'cache|tier'
# expect X-Cache-Status: MISS first, HIT on replay

# Logged-in (cacheable route) — origin emits public/s-maxage; nginx caches
curl -sI --cookie "active_user=alice" -H "Host: ecency.com" \
  "http://127.0.0.1/@<author>" | grep -iE 'cache|tier'
# expect Cache-Control: public ... s-maxage=300
# expect X-Cache-Status: MISS first, HIT on replay

# Logged-in (feed) — never cached, X-Cache-Status: BYPASS or MISS each time
curl -sI --cookie "active_user=alice" -H "Host: ecency.com" \
  "http://127.0.0.1/created" | grep -iE 'cache|tier'
# expect Cache-Control: private, no-store
# expect X-Cache-Tier: feed-created-loggedin
```

## Rollout

1. Apply config in staging, verify config test (`nginx -t`).
2. Reload via `systemctl reload nginx` (zero downtime).
3. Watch `$upstream_cache_status` distribution in access logs — HIT% should
   climb on cacheable routes within a few hours of warmup under normal load.
