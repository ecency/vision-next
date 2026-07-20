# Origin configuration for managed blog hosting

Config that lives on the machine terminating TLS for `*.blogs.ecency.com`, kept here so it
is reviewable and restorable rather than existing only on that box.

**Nothing here is deployed automatically.** The CI job copies only `docker-compose.yml`,
`nginx-multi-tenant.conf`, `default-config.json` and `db/*` from the parent directory.
These files need root and an nginx reload, and a bad edit takes every hosted blog offline,
so they are applied by hand via `install.sh`. That means the box stays the source of truth
in practice — **re-copy any change made there back into this directory.**

## Files

| file | on the origin | purpose |
|---|---|---|
| `blogs.ecency.com.conf` | `/etc/nginx/sites-available/` | TLS termination and proxying for the apex, the API, and tenant subdomains |
| `sync-custom-domains.py` | cron, every 5 min | issues certificates and writes vhosts for custom domains and dotted tenant names |
| `install.sh` | once, idempotent | nginx include dir, certbot deploy hook, cron entry |

## What the sync does

1. Reads verified custom domains of active pro tenants from the hosting DB (read-only),
   plus any tenant whose Hive account name contains a dot.
2. Confirms the host resolves to this origin before asking for a certificate, which keeps
   domains pointed elsewhere from burning Let's Encrypt failure limits.
3. Issues via HTTP-01 webroot and writes a vhost that proxies to the blog container with
   `X-Tenant-Id` set.
4. Removes vhosts and stops renewing certificates for anything no longer in the DB, then
   reloads nginx if something changed. A vhost that fails `nginx -t` is quarantined as
   `.broken` rather than wedging every later reload.

## origin-ips (not in git)

The DNS check above needs this origin's own addresses. They are read from an `origin-ips`
file next to the script — one per line, `#` comments allowed — or from
`HOSTING_ORIGIN_IPS` as a comma-separated override.

They are not committed because this repository is public and those addresses sit behind
Cloudflare; publishing them would amount to handing out an origin-bypass list. The script
exits with an explanatory error when the file is missing, rather than silently failing
every DNS check and never issuing a certificate again.

## Two things in the vhost that are load-bearing

- **`location /.well-known/acme-challenge/` on port 80.** Without it the block below
  redirects to HTTPS, and a host with no certificate yet can never obtain one — the
  challenge follows the redirect into a certificate that does not cover it. Dotted Hive
  account names depend on this: a wildcard certificate matches exactly one label, so
  `alice.dev.blogs.ecency.com` needs its own.
- **`proxy_set_header X-Tenant-Id ""` on the tenant vhost.** Only the generated
  custom-domain vhosts are entitled to set that header. Clearing it here stops a client
  supplying its own, which would otherwise reach the container's tenant lookup.

## Notes

- Domains under `ecency.com` are refused regardless of what the DB says.
- A domain that stops resolving here simply stops being renewed and served; nothing else
  breaks.
- Renewals run from `certbot.timer`; the deploy hook reloads nginx, which also closes a
  pre-existing gap where the wildcard renewed but nginx kept serving the old certificate.
