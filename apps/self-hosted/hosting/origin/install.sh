#!/bin/bash
# One-shot installer for custom-domain serving on this origin.
# Idempotent; safe to re-run.
set -euo pipefail

# Where this script lives, so it runs from a checkout or from wherever it was copied.
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "1/5 nginx include dir + sites-enabled hook"
mkdir -p /etc/nginx/custom-domains
echo 'include /etc/nginx/custom-domains/*.conf;' > /etc/nginx/sites-enabled/custom-domains

echo "2/5 certbot deploy hook (reload nginx after any renewal, incl. the wildcard)"
# certbot creates this tree on first use; a rebuilt origin may not have it yet, and
# set -e would abort here before cron and the initial sync are installed.
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'EOF'
#!/bin/sh
# Reload nginx so renewed certificates are actually served.
nginx -t && systemctl reload nginx
EOF
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

echo "3/5 nginx config test + reload"
nginx -t
systemctl reload nginx

echo "4/5 cron (every 5 minutes)"
cat > /etc/cron.d/hosting-custom-domains <<EOF
*/5 * * * * root /usr/bin/python3 "$BASE/sync-custom-domains.py" >> "$BASE/cron.log" 2>&1
EOF
chmod 644 /etc/cron.d/hosting-custom-domains

echo "5/5 initial sync"
/usr/bin/python3 "$BASE/sync-custom-domains.py"

echo "Done. Logs: $BASE/sync.log"
