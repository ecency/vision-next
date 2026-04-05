#!/usr/bin/env bash
#
# Purge specific URLs from the Cloudflare edge cache.
#
# Usage:
#   ./scripts/purge-cache.sh <url1> [url2] [url3] ...
#
# Example:
#   ./scripts/purge-cache.sh \
#     "https://ecency.com/hive-123456/@alice/bad-post" \
#     "https://ecency.com/@alice"
#
# Environment variables required:
#   CF_ZONE_ID   - Cloudflare zone ID for ecency.com
#   CF_API_TOKEN - Cloudflare API token with Cache Purge permission
#
# Cloudflare allows up to 30 URLs per purge request. This script batches
# automatically if you pass more.
#
# Typical workflow (DMCA takedown):
#   1. Edit apps/web/public/dmca/dmca-*.json
#   2. Commit, merge, let CI deploy
#   3. Run this script with the affected URLs to drop the pre-DMCA HTML
#      from the CF edge cache
#
set -euo pipefail

if [[ -z "${CF_ZONE_ID:-}" || -z "${CF_API_TOKEN:-}" ]]; then
  echo "Error: CF_ZONE_ID and CF_API_TOKEN must be set" >&2
  exit 1
fi

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <url1> [url2] ..." >&2
  exit 1
fi

batch_size=30
urls=("$@")
total=${#urls[@]}
idx=0

while [[ $idx -lt $total ]]; do
  end=$(( idx + batch_size ))
  if [[ $end -gt $total ]]; then
    end=$total
  fi

  batch=("${urls[@]:$idx:$((end - idx))}")

  # Build JSON array of URLs
  json_files=$(printf '"%s",' "${batch[@]}")
  json_files="[${json_files%,}]"
  payload="{\"files\":${json_files}}"

  echo "Purging batch: ${batch[*]}"

  response=$(curl -sS -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${payload}")

  success=$(echo "$response" | grep -o '"success":[^,}]*' | head -n1 | cut -d: -f2 | tr -d ' ')
  if [[ "$success" != "true" ]]; then
    echo "Purge failed: $response" >&2
    exit 1
  fi

  echo "Batch purged successfully."
  idx=$end
done

echo "Done. Purged $total URL(s)."
