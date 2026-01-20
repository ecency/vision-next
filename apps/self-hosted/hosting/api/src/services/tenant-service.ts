/**
 * Tenant Service
 */

import { db } from '../db/client';
import { Client } from '@hiveio/dhive';

const hiveClient = new Client(process.env.HIVE_API_URL?.split(',') || ['https://api.hive.blog']);
const baseDomain = process.env.BASE_DOMAIN || 'blogs.ecency.com';

export interface Tenant {
  id: string;
  username: string;
  subscription_status: 'inactive' | 'active' | 'expired' | 'suspended';
  subscription_plan: 'standard' | 'pro';
  subscription_started_at: Date | null;
  subscription_expires_at: Date | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  custom_domain_verified_at: Date | null;
  config: any;
  created_at: Date;
  updated_at: Date;
}

export const TenantService = {
  /**
   * Get tenant by username
   */
  async getByUsername(username: string): Promise<Tenant | null> {
    return db.queryOne<Tenant>(
      'SELECT * FROM tenants WHERE username = $1',
      [username.toLowerCase()]
    );
  },
  
  /**
   * Get tenant by custom domain
   */
  async getByDomain(domain: string): Promise<Tenant | null> {
    return db.queryOne<Tenant>(
      'SELECT * FROM tenants WHERE custom_domain = $1 AND custom_domain_verified = true',
      [domain.toLowerCase()]
    );
  },
  
  /**
   * Create new tenant
   */
  async create(username: string, configOverrides?: any): Promise<Tenant> {
    const defaultConfig = await this.getDefaultConfig(username);
    const config = configOverrides 
      ? this.mergeConfig(defaultConfig, configOverrides)
      : defaultConfig;
    
    const result = await db.queryOne<Tenant>(
      `INSERT INTO tenants (username, config, subscription_status, subscription_plan)
       VALUES ($1, $2, 'inactive', 'standard')
       RETURNING *`,
      [username.toLowerCase(), JSON.stringify(config)]
    );
    
    return result!;
  },
  
  /**
   * Activate subscription
   */
  async activateSubscription(username: string, months: number): Promise<Tenant> {
    const tenant = await this.getByUsername(username);
    if (!tenant) throw new Error('Tenant not found');
    
    const now = new Date();
    const currentExpiry = tenant.subscription_expires_at 
      ? new Date(tenant.subscription_expires_at)
      : now;
    
    // If expired, start from now; otherwise extend from current expiry
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + months);
    
    const startedAt = tenant.subscription_started_at || now;
    
    const result = await db.queryOne<Tenant>(
      `UPDATE tenants 
       SET subscription_status = 'active',
           subscription_started_at = $2,
           subscription_expires_at = $3,
           updated_at = NOW()
       WHERE username = $1
       RETURNING *`,
      [username.toLowerCase(), startedAt, newExpiry]
    );
    
    return result!;
  },
  
  /**
   * Upgrade to Pro plan
   */
  async upgradeToPro(username: string): Promise<Tenant> {
    const result = await db.queryOne<Tenant>(
      `UPDATE tenants 
       SET subscription_plan = 'pro',
           updated_at = NOW()
       WHERE username = $1
       RETURNING *`,
      [username.toLowerCase()]
    );
    
    if (!result) throw new Error('Tenant not found');
    return result;
  },
  
  /**
   * Update tenant config
   */
  async updateConfig(username: string, configUpdates: any): Promise<Tenant> {
    const tenant = await this.getByUsername(username);
    if (!tenant) throw new Error('Tenant not found');
    
    const newConfig = this.mergeConfig(tenant.config, configUpdates);
    
    const result = await db.queryOne<Tenant>(
      `UPDATE tenants 
       SET config = $2,
           updated_at = NOW()
       WHERE username = $1
       RETURNING *`,
      [username.toLowerCase(), JSON.stringify(newConfig)]
    );
    
    return result!;
  },
  
  /**
   * Set custom domain
   */
  async setCustomDomain(username: string, domain: string): Promise<Tenant> {
    const result = await db.queryOne<Tenant>(
      `UPDATE tenants 
       SET custom_domain = $2,
           custom_domain_verified = false,
           custom_domain_verified_at = NULL,
           updated_at = NOW()
       WHERE username = $1
       RETURNING *`,
      [username.toLowerCase(), domain.toLowerCase()]
    );
    
    if (!result) throw new Error('Tenant not found');
    return result;
  },
  
  /**
   * Verify custom domain
   */
  async verifyCustomDomain(username: string): Promise<Tenant> {
    const result = await db.queryOne<Tenant>(
      `UPDATE tenants 
       SET custom_domain_verified = true,
           custom_domain_verified_at = NOW(),
           updated_at = NOW()
       WHERE username = $1
       RETURNING *`,
      [username.toLowerCase()]
    );
    
    if (!result) throw new Error('Tenant not found');
    return result;
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
  async getActivetenants(): Promise<Tenant[]> {
    return db.queryAll<Tenant>(
      `SELECT * FROM tenants WHERE subscription_status = 'active' ORDER BY username`
    );
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
    if (tenant.custom_domain && tenant.custom_domain_verified) {
      return `https://${tenant.custom_domain}`;
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
   */
  mergeConfig(base: any, updates: any): any {
    const result = { ...base };
    
    for (const key of Object.keys(updates)) {
      if (updates[key] && typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
        result[key] = this.mergeConfig(result[key] || {}, updates[key]);
      } else if (updates[key] !== undefined) {
        result[key] = updates[key];
      }
    }
    
    return result;
  },
};

export default TenantService;
