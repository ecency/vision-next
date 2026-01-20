/**
 * Domain Service
 *
 * Handles custom domain verification
 */

import { promises as dns } from 'dns';
import { db } from '../db/client';
import { nanoid } from 'nanoid';

const baseDomain = process.env.BASE_DOMAIN || 'blogs.ecency.com';

export interface DomainVerification {
  id: string;
  tenant_id: string;
  domain: string;
  verification_token: string;
  verification_method: 'cname' | 'txt';
  verified: boolean;
  verified_at: Date | null;
  expires_at: Date;
  created_at: Date;
}

export const DomainService = {
  /**
   * Create domain verification record
   */
  async createVerification(username: string, domain: string): Promise<DomainVerification> {
    // Get tenant ID
    const tenant = await db.queryOne<{ id: string }>(
      'SELECT id FROM tenants WHERE username = $1',
      [username]
    );

    if (!tenant) throw new Error('Tenant not found');

    // Generate verification token
    const token = '_ecency-verify.' + nanoid(16);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to verify

    // Delete any existing verification for this domain
    await db.query(
      'DELETE FROM domain_verifications WHERE tenant_id = $1',
      [tenant.id]
    );

    // Create new verification
    const result = await db.queryOne<DomainVerification>(
      `INSERT INTO domain_verifications
       (tenant_id, domain, verification_token, verification_method, expires_at)
       VALUES ($1, $2, $3, 'cname', $4)
       RETURNING *`,
      [tenant.id, domain.toLowerCase(), token, expiresAt]
    );

    return result!;
  },

  /**
   * Verify domain via DNS lookup
   */
  async verifyDomain(domain: string, username: string): Promise<boolean> {
    const expectedTarget = username + '.' + baseDomain;

    try {
      // Check CNAME record
      const records = await dns.resolveCname(domain);

      for (const record of records) {
        // Check if CNAME points to our domain
        if (record.toLowerCase() === expectedTarget.toLowerCase()) {
          return true;
        }
        // Also accept direct match to base domain with wildcard
        if (record.toLowerCase().endsWith('.' + baseDomain.toLowerCase())) {
          return true;
        }
      }

      return false;
    } catch (err: any) {
      // ENODATA means no CNAME record
      // ENOTFOUND means domain doesn't exist
      console.log('[DomainService] DNS lookup failed for', domain, err.code);
      return false;
    }
  },

  /**
   * Mark domain as verified
   */
  async markVerified(username: string, domain: string): Promise<void> {
    const tenant = await db.queryOne<{ id: string }>(
      'SELECT id FROM tenants WHERE username = $1',
      [username]
    );

    if (!tenant) return;

    await db.query(
      `UPDATE domain_verifications
       SET verified = true, verified_at = NOW()
       WHERE tenant_id = $1 AND domain = $2`,
      [tenant.id, domain.toLowerCase()]
    );
  },

  /**
   * Get pending verifications (for cleanup job)
   */
  async getExpiredVerifications(): Promise<DomainVerification[]> {
    return db.queryAll<DomainVerification>(
      `SELECT * FROM domain_verifications
       WHERE verified = false AND expires_at < NOW()`
    );
  },

  /**
   * Delete expired verifications
   */
  async cleanupExpiredVerifications(): Promise<number> {
    const result = await db.query(
      `DELETE FROM domain_verifications
       WHERE verified = false AND expires_at < NOW()`
    );
    return result.rowCount || 0;
  },
};

export default DomainService;
