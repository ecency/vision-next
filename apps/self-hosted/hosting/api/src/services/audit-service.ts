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
      console.error('[AuditService] Failed to write audit log:', err);
    });
  },
};
