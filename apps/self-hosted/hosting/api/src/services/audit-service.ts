/**
 * Audit Logging Service
 *
 * Fire-and-forget inserts into the audit_log table.
 * Never throws — errors are logged but swallowed so callers are unaffected.
 */

import { db } from '../db/client';

export interface AuditEntry {
  tenantId?: string | null;
  eventType: string;
  eventData?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Extract client IP from X-Forwarded-For header.
 * Takes the rightmost entry, which is the IP added by the nearest trusted
 * reverse proxy (Traefik). The leftmost entries can be spoofed by the client.
 */
export function parseClientIp(xForwardedFor: string | undefined): string | null {
  if (!xForwardedFor) return null;
  const parts = xForwardedFor.split(',');
  return parts[parts.length - 1]?.trim() || null;
}

export const AuditService = {
  log(entry: AuditEntry): void {
    const { tenantId, eventType, eventData, ipAddress, userAgent } = entry;

    db.query(
      `INSERT INTO audit_log (tenant_id, event_type, event_data, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        tenantId ?? null,
        eventType,
        eventData ? JSON.stringify(eventData) : null,
        ipAddress ?? null,
        userAgent ?? null,
      ],
    ).catch((err) => {
      console.error(`[AuditService] Failed to write audit log for eventType=${eventType}:`, err);
    });
  },
};
