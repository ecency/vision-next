/**
 * Verified custom domains as first-party CORS origins.
 *
 * The SPA on a verified custom domain calls this API cross-origin (config saves, auth
 * exchange), so those origins must be allowed. The CORS origin callback is synchronous,
 * so the set is kept in memory: loaded at startup, refreshed periodically, and updated
 * immediately when a domain verification succeeds in this process.
 */

import { db } from '../db/client';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

let verifiedOrigins = new Set<string>();
let refreshTimer: ReturnType<typeof setInterval> | null = null;

export async function refreshVerifiedDomainOrigins(): Promise<void> {
  try {
    const rows = await db.queryAll<{ custom_domain: string }>(
      `SELECT custom_domain FROM tenants
       WHERE custom_domain IS NOT NULL AND custom_domain_verified = true`
    );
    verifiedOrigins = new Set(
      rows
        .filter((r) => r.custom_domain)
        .map((r) => `https://${r.custom_domain.toLowerCase()}`)
    );
  } catch (e) {
    // Keep the previous set; a transient DB error must not drop working origins.
    console.error('[CorsDomains] refresh failed:', (e as Error).message);
  }
}

/** Start the periodic refresh (idempotent). */
export function startVerifiedDomainRefresh(): void {
  if (refreshTimer) return;
  void refreshVerifiedDomainOrigins();
  refreshTimer = setInterval(() => void refreshVerifiedDomainOrigins(), REFRESH_INTERVAL_MS);
  refreshTimer.unref?.();
}

/** Allow a just-verified domain without waiting for the next refresh. */
export function addVerifiedDomainOrigin(domain: string): void {
  verifiedOrigins.add(`https://${domain.toLowerCase()}`);
}

export function isVerifiedDomainOrigin(origin: string): boolean {
  return verifiedOrigins.has(origin.toLowerCase());
}
