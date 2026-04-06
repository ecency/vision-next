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
# Requires: jq (for safe JSON construction)
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

if ! command -v jq &>/dev/null; then
  echo "Error: jq is required but not installed" >&2
  exit 1
fi

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

  # Build JSON payload safely via jq (handles quotes, backslashes, unicode)
  json_files=$(printf '%s\n' "${batch[@]}" | jq -R . | jq -s .)
  payload=$(jq -n --argjson files "$json_files" '{"files": $files}')

  echo "Purging batch: ${batch[*]}"

  response=$(curl -sS --fail-with-body \
    --connect-timeout 5 --max-time 15 \
    -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${payload}") || {
      echo "Purge request failed (curl error or HTTP error): ${response:-<no body>}" >&2
      exit 1
    }

  success=$(echo "$response" | jq -r '.success // "null"' 2>/dev/null || echo "null")
  if [[ "$success" != "true" ]]; then
    echo "Purge failed: $response" >&2
    exit 1
  fi

  echo "Batch purged successfully."
  idx=$end
done

echo "Done. Purged $total URL(s)."
