/**
 * Tenant Service
 */

import { db } from '../db/client';
import { Client } from '@hiveio/dhive';
import { Tenant, TenantRow, mapTenantFromDb } from '../../types';

// Re-export Tenant type for backward compatibility
export type { Tenant } from '../../types';

const hiveClient = new Client(process.env.HIVE_API_URL?.split(',') || ['https://api.hive.blog']);
const baseDomain = process.env.BASE_DOMAIN || 'blogs.ecency.com';

export const TenantService = {
  /**
   * Get tenant by username
   */
  async getByUsername(username: string): Promise<Tenant | null> {
    const row = await db.queryOne<TenantRow>(
      'SELECT * FROM tenants WHERE username = $1',
      [username.toLowerCase()]
    );
    return row ? mapTenantFromDb(row) : null;
  },
  
  /**
   * Get tenant by custom domain
   */
  async getByDomain(domain: string): Promise<Tenant | null> {
    const row = await db.queryOne<TenantRow>(
      'SELECT * FROM tenants WHERE custom_domain = $1 AND custom_domain_verified = true',
      [domain.toLowerCase()]
    );
    return row ? mapTenantFromDb(row) : null;
  },
  
  /**
   * Create new tenant
   */
  async create(username: string, configOverrides?: any): Promise<Tenant> {
    const defaultConfig = await this.getDefaultConfig(username);
    const config = configOverrides
      ? this.mergeConfig(defaultConfig, configOverrides)
      : defaultConfig;

    const row = await db.queryOne<TenantRow>(
      `INSERT INTO tenants (username, config, subscription_status, subscription_plan)
       VALUES ($1, $2, 'inactive', 'standard')
       RETURNING *`,
      [username.toLowerCase(), JSON.stringify(config)]
    );

    return mapTenantFromDb(row!);
  },
  
  /**
   * Activate subscription
   */
  async activateSubscription(username: string, months: number): Promise<Tenant> {
    const tenant = await this.getByUsername(username);
    if (!tenant) throw new Error('Tenant not found');

    const now = new Date();
    const currentExpiry = tenant.subscriptionExpiresAt
      ? new Date(tenant.subscriptionExpiresAt)
      : now;

    // If expired, start from now; otherwise extend from current expiry
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + months);

    const startedAt = tenant.subscriptionStartedAt || now;

    const row = await db.queryOne<TenantRow>(
      `UPDATE tenants
       SET subscription_status = 'active',
           subscription_started_at = $2,
           subscription_expires_at = $3,
           updated_at = NOW()
       WHERE username = $1
       RETURNING *`,
      [username.toLowerCase(), startedAt, newExpiry]
    );

    return mapTenantFromDb(row!);
  },
  
  /**
   * Upgrade to Pro plan
   */
  async upgradeToPro(username: string): Promise<Tenant> {
    const row = await db.queryOne<TenantRow>(
      `UPDATE tenants
       SET subscription_plan = 'pro',
           updated_at = NOW()
       WHERE username = $1
       RETURNING *`,
      [username.toLowerCase()]
    );

    if (!row) throw new Error('Tenant not found');
    return mapTenantFromDb(row);
  },
  
  /**
   * Update tenant config
   */
  async updateConfig(username: string, configUpdates: any): Promise<Tenant> {
    const tenant = await this.getByUsername(username);
    if (!tenant) throw new Error('Tenant not found');

    const newConfig = this.mergeConfig(tenant.config, configUpdates);

    const row = await db.queryOne<TenantRow>(
      `UPDATE tenants
       SET config = $2,
           updated_at = NOW()
       WHERE username = $1
       RETURNING *`,
      [username.toLowerCase(), JSON.stringify(newConfig)]
    );

    return mapTenantFromDb(row!);
  },
  
  /**
   * Set custom domain
   */
  async setCustomDomain(username: string, domain: string): Promise<Tenant> {
    const row = await db.queryOne<TenantRow>(
      `UPDATE tenants
       SET custom_domain = $2,
           custom_domain_verified = false,
           custom_domain_verified_at = NULL,
           updated_at = NOW()
       WHERE username = $1
       RETURNING *`,
      [username.toLowerCase(), domain.toLowerCase()]
    );

    if (!row) throw new Error('Tenant not found');
    return mapTenantFromDb(row);
  },
  
  /**
   * Verify custom domain
   */
  async verifyCustomDomain(username: string): Promise<Tenant> {
    const row = await db.queryOne<TenantRow>(
      `UPDATE tenants
       SET custom_domain_verified = true,
           custom_domain_verified_at = NOW(),
           updated_at = NOW()
       WHERE username = $1
       RETURNING *`,
      [username.toLowerCase()]
    );

    if (!row) throw new Error('Tenant not found');
    return mapTenantFromDb(row);
  },

  /**
   * Remove custom domain and clean up verification records
   */
  async removeCustomDomain(username: string): Promise<void> {
    await db.transaction(async (client) => {
      // Get tenant first
      const tenant = await client.query<{ id: string }>(
        'SELECT id FROM tenants WHERE username = $1',
        [username.toLowerCase()]
      );

      if (tenant.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      const tenantId = tenant.rows[0].id;

      // Remove custom domain from tenant
      await client.query(
        `UPDATE tenants
         SET custom_domain = NULL,
             custom_domain_verified = false,
             custom_domain_verified_at = NULL,
             updated_at = NOW()
         WHERE username = $1`,
        [username.toLowerCase()]
      );

      // Delete related domain verification records
      await client.query(
        'DELETE FROM domain_verifications WHERE tenant_id = $1',
        [tenantId]
      );
    });
  },
  
  /**
   * Delete tenant
   */
  async delete(username: string): Promise<void> {
    await db.query('DELETE FROM tenants WHERE username = $1', [username.toLowerCase()]);
  },
  
  /**
   * Expire subscriptions that have passed their expiry date
   */
  async expireSubscriptions(): Promise<number> {
    const result = await db.query(
      `UPDATE tenants 
       SET subscription_status = 'expired'
       WHERE subscription_status = 'active' 
         AND subscription_expires_at < NOW()`
    );
    return result.rowCount || 0;
  },
  
  /**
   * Get all active tenants
   */
  async getActiveTenants(): Promise<Tenant[]> {
    const rows = await db.queryAll<TenantRow>(
      `SELECT * FROM tenants WHERE subscription_status = 'active' ORDER BY username`
    );
    return rows.map(mapTenantFromDb);
  },
  
  /**
   * Verify Hive account exists
   */
  async verifyHiveAccount(username: string): Promise<boolean> {
    try {
      const accounts = await hiveClient.database.getAccounts([username]);
      return accounts.length > 0;
    } catch {
      return false;
    }
  },
  
  /**
   * Get blog URL for tenant
   */
  getBlogUrl(tenant: Tenant): string {
    if (tenant.customDomain && tenant.customDomainVerified) {
      return `https://${tenant.customDomain}`;
    }
    return `https://${tenant.username}.${baseDomain}`;
  },
  
  /**
   * Get default config for a new tenant
   */
  async getDefaultConfig(username: string): Promise<any> {
    return {
      version: 1,
      configuration: {
        general: {
          theme: 'system',
          styleTemplate: 'medium',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: 'HH:mm:ss',
          dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
          imageProxy: 'https://images.ecency.com',
          profileBaseUrl: 'https://ecency.com/@',
          createPostUrl: 'https://ecency.com/submit',
          styles: {
            background: 'bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0]',
          },
        },
        instanceConfiguration: {
          type: 'blog',
          username: username,
          communityId: '',
          meta: {
            title: `${username}'s Blog`,
            description: 'A blog powered by Hive blockchain',
            logo: '',
            favicon: 'https://ecency.com/favicon.ico',
            keywords: 'hive, blog, blockchain',
          },
          layout: {
            listType: 'list',
            search: { enabled: true },
            sidebar: {
              placement: 'right',
              followers: { enabled: true },
              following: { enabled: true },
              hiveInformation: { enabled: true },
            },
          },
          features: {
            postsFilters: ['posts', 'blog'],
            likes: { enabled: true },
            comments: { enabled: true },
            post: { text2Speech: { enabled: true } },
            auth: {
              enabled: true,
              methods: ['keychain', 'hivesigner', 'hiveauth'],
            },
          },
        },
      },
    };
  },
  
  /**
   * Deep merge configs
   * Protected against prototype pollution attacks
   */
  mergeConfig(base: any, updates: any): any {
    // Create result with null prototype to prevent pollution
    const result = Object.assign(Object.create(null), base);

    // Only iterate own enumerable string keys
    for (const key of Object.keys(updates)) {
      // Skip prototype pollution vectors
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        console.warn('[TenantService] Blocked prototype pollution attempt with key:', key);
        continue;
      }

      const value = updates[key];

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively merge objects, using empty plain object as default
        result[key] = this.mergeConfig(result[key] || Object.create(null), value);
      } else if (value !== undefined) {
        result[key] = value;
      }
    }

    return result;
  },
};

export default TenantService;
