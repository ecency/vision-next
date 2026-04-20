# Nginx Cache Alignment

Changes required in the production Nginx config to respect the Cache-Control
headers emitted by the Next.js middleware.

## Required changes

### 1. Respect origin Cache-Control for HTML

**Remove** any `proxy_ignore_headers Cache-Control;` directive that applies to
HTML responses. Next.js is the source of truth.

**Set** `proxy_cache_valid` to defer to origin:

```nginx
# Respect Cache-Control from origin (Next.js middleware)
proxy_cache_valid 200 0;
# Keep short fallback for responses without Cache-Control
proxy_cache_valid any 30s;
```

### 2. Cookie-aware cache key and bypass

Logged-in users must never see cached anonymous HTML, and vice versa.

```nginx
# Vary cache by auth state
proxy_cache_key "$scheme$request_method$host$request_uri$cookie_active_user";

# Skip cache entirely when user is logged in
proxy_cache_bypass $cookie_active_user;
proxy_no_cache     $cookie_active_user;
```

### 3. Respect `stale-while-revalidate`

Nginx supports serving stale content via `proxy_cache_use_stale`:

```nginx
proxy_cache_use_stale updating error timeout http_500 http_502 http_503 http_504;
proxy_cache_background_update on;
proxy_cache_lock on;
```

`proxy_cache_background_update on` is the Nginx equivalent of
`stale-while-revalidate` — it serves stale content to the client while
fetching a fresh copy in the background.

### 4. Expose cache status for observability

```nginx
add_header X-Cache-Status $upstream_cache_status always;
# Preserve the tier header set by middleware
add_header X-Cache-Tier $upstream_http_x_cache_tier always;
```

## Example block

```nginx
proxy_cache_path /var/cache/nginx/ssr levels=1:2 keys_zone=ssr_cache:50m
                 max_size=5g inactive=7d use_temp_path=off;

server {
  listen 80;
  server_name ecency.com;

  location / {
    proxy_cache                  ssr_cache;
    proxy_cache_key              "$scheme$request_method$host$request_uri$cookie_active_user";
    proxy_cache_valid            200 0;    # defer to origin
    proxy_cache_valid            any 30s;  # fallback
    proxy_cache_bypass           $cookie_active_user;
    proxy_no_cache               $cookie_active_user;
    proxy_cache_use_stale        updating error timeout http_500 http_502 http_503 http_504;
    proxy_cache_background_update on;
    proxy_cache_lock             on;

    add_header X-Cache-Status $upstream_cache_status always;
    add_header X-Cache-Tier   $upstream_http_x_cache_tier always;

    proxy_pass http://vision_next_upstream;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Verification

After applying these changes, verify with:

```bash
# First request — MISS
curl -sI https://ecency.com/discover | grep -iE 'cache|tier'
# X-Cache-Status: MISS
# X-Cache-Tier: list
# Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=3600

# Second request — HIT
curl -sI https://ecency.com/discover | grep -iE 'cache|tier'
# X-Cache-Status: HIT

# Logged-in bypass
curl -sI --cookie "active_user=alice" https://ecency.com/discover | grep -iE 'cache|tier'
# X-Cache-Status: BYPASS
# X-Cache-Tier: logged-in
# Cache-Control: private, no-store
```

## Rollout

1. Apply in staging, verify headers
2. Watch origin RPS — should drop sharply
3. Roll to production region-by-region
