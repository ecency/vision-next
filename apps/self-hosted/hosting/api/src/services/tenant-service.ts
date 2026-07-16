/**
 * Tenant Service
 */

import { db } from '../db/client';
import { callRPC, config as hiveTxConfig } from '@ecency/sdk/hive';
import { Tenant, TenantRow, mapTenantFromDb } from '../types';

// Re-export Tenant type for backward compatibility
export type { Tenant } from '../types';

// Configure hive-tx nodes
hiveTxConfig.nodes = process.env.HIVE_API_URL?.split(',') || ['https://api.hive.blog'];
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
   * All tenants controlled by an owner account (their personal blog and any communities).
   */
  async getByOwner(owner: string): Promise<Tenant[]> {
    const rows = await db.queryAll<TenantRow>(
      'SELECT * FROM tenants WHERE owner = $1 ORDER BY created_at',
      [owner.toLowerCase()]
    );
    return rows.map(mapTenantFromDb);
  },
  
  /**
   * Create new tenant.
   *
   * `owner` is the Hive account that controls the instance and every mutating op is later
   * authorized against it. It defaults to `username` (a personal blog, where the showcased
   * account is also the owner). For a community the caller passes their own account as `owner`
   * while `username` is the community account (hive-NNNNN).
   */
  async create(username: string, owner?: string, configOverrides?: any): Promise<Tenant> {
    const ownerName = (owner || username).toLowerCase();

    // buildConfig normalizes flat API overrides (title, description, theme, styleTemplate, type,
    // communityId) into the nested shape the SPA actually reads. Merging the flat keys directly kept
    // them at the config root, where the SPA ignores them, so a signup's chosen title/theme/style
    // were silently dropped (and any community override too). Route both paths through buildConfig.
    const config = await this.buildConfig(username, configOverrides, ownerName);

    const row = await db.queryOne<TenantRow>(
      `INSERT INTO tenants (username, owner, config, subscription_status, subscription_plan)
       VALUES ($1, $2, $3, 'inactive', 'standard')
       RETURNING *`,
      [username.toLowerCase(), ownerName, JSON.stringify(config)]
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

    // Flat keys must be normalized into the nested stored shape first; merging them at the
    // config root leaves them where the SPA never reads them (same bug create() had).
    const newConfig = this.mergeConfig(
      tenant.config,
      this.normalizeFlatOverrides(configUpdates || {})
    );

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
   * Apply a config document edited in the instance's Configuration Editor. The sanitized
   * document is deep-merged into the stored config, so a partial document can only change the
   * sections it carries and can never erase the rest. Identity fields (username, owner, type,
   * communityId) are server-owned and pinned from the stored config so a config save can
   * never reassign control or re-type the tenant.
   */
  async applyConfigDocument(username: string, doc: any): Promise<Tenant> {
    const tenant = await this.getByUsername(username);
    if (!tenant) throw new Error('Tenant not found');

    const current = tenant.config?.configuration?.instanceConfiguration || {};
    // Identity comes from the tenant ROW (authorization's source of truth), never from the
    // stored config JSON, which could carry stale values from before the owner column.
    const clean = this.sanitizeConfigDocument(doc, {
      version: tenant.config?.version ?? 1,
      username: tenant.username,
      owner: tenant.owner,
      type: current.type ?? 'blog',
      communityId: current.communityId ?? '',
    });
    const newConfig = this.mergeConfig(tenant.config, clean);

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
   * Recursively drop null values from a client document. mergeConfig treats null as a
   * replacement value, so without this a document carrying `general: null` (or any nulled
   * nested key) would erase that whole stored section on merge. Null never means anything
   * in a config document; absence does. Pure.
   */
  stripNulls(value: any): any {
    if (Array.isArray(value)) {
      return value.filter((item) => item !== null && item !== undefined).map((item) => this.stripNulls(item));
    }
    if (value && typeof value === 'object') {
      const result: any = Object.create(null);
      for (const key of Object.keys(value)) {
        if (value[key] === null || value[key] === undefined) continue;
        result[key] = this.stripNulls(value[key]);
      }
      return result;
    }
    return value;
  },

  /**
   * Sanitize a client-supplied full config document: drop null values (a null section must
   * never erase stored settings), deep-copy through mergeConfig (strips prototype-pollution
   * vectors) and pin the server-owned identity fields. Pure.
   */
  sanitizeConfigDocument(
    doc: any,
    pins: { version: number; username: string; owner: string; type: string; communityId: string }
  ): any {
    const clean = this.mergeConfig(Object.create(null), this.stripNulls(doc || {}));
    clean.version = pins.version;
    // Arrays must be rejected, not just non-objects: an array passes typeof === 'object',
    // silently drops any pinned properties when serialized, and would replace the stored
    // object section wholesale on merge.
    if (
      !clean.configuration ||
      typeof clean.configuration !== 'object' ||
      Array.isArray(clean.configuration) ||
      Array.isArray(clean.configuration.instanceConfiguration)
    ) {
      throw new Error('Invalid configuration document');
    }
    const instance = (clean.configuration.instanceConfiguration =
      clean.configuration.instanceConfiguration &&
      typeof clean.configuration.instanceConfiguration === 'object'
        ? clean.configuration.instanceConfiguration
        : Object.create(null));

    instance.username = pins.username;
    instance.owner = pins.owner;
    instance.type = pins.type;
    instance.communityId = pins.communityId;
    // Served-only marker (injected at config-file generation); must never round-trip from a
    // client document into the stored config.
    delete instance.managed;

    return clean;
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
      const accounts = await callRPC('condenser_api.get_accounts', [[username]]) as any[];
      return Array.isArray(accounts) && accounts.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Verify a Hive community exists (not merely an account named hive-NNNNN).
   */
  async verifyCommunity(communityId: string): Promise<boolean> {
    try {
      const community = await callRPC('bridge.get_community', { name: communityId, observer: '' }) as any;
      return !!community && community.name === communityId;
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
   * Build the full tenant config from defaults + overrides.
   * Normalizes flat API overrides into the nested stored config shape.
   * Pure function, safe to call outside a DB transaction.
   */
  async buildConfig(username: string, configOverrides?: any, owner?: string): Promise<any> {
    const defaults = await this.getDefaultConfig(username, owner);
    const merged = configOverrides
      ? this.mergeConfig(defaults, this.normalizeFlatOverrides(configOverrides))
      : defaults;

    // A community instance browses community feeds, not a personal blog's timeline; give it
    // community defaults wherever the signup didn't say otherwise.
    const instance = merged.configuration.instanceConfiguration;
    if (instance.type === 'community') {
      instance.features.postsFilters = ['trending', 'hot', 'created'];
      const communityId = instance.communityId || username;
      if (!configOverrides?.title) {
        const communityTitle = await this.getCommunityTitle(communityId);
        instance.meta.title = communityTitle || `${communityId} community`;
      }
      if (!configOverrides?.description) {
        instance.meta.description = 'A community powered by Hive blockchain';
      }
    }

    return merged;
  },

  /**
   * Map flat API keys (signup form / legacy PATCH body) to their nested stored-config paths.
   * Owner is server-resolved, not client-supplied, so it is never taken from overrides.
   */
  normalizeFlatOverrides(configOverrides: any): any {
    const normalized: any = {
      configuration: {
        general: {},
        instanceConfiguration: { meta: {}, layout: { sidebar: {} } },
      },
    };
    if (configOverrides.theme) normalized.configuration.general.theme = configOverrides.theme;
    if (configOverrides.styleTemplate) normalized.configuration.general.styleTemplate = configOverrides.styleTemplate;
    if (configOverrides.type) normalized.configuration.instanceConfiguration.type = configOverrides.type;
    if (configOverrides.communityId) normalized.configuration.instanceConfiguration.communityId = configOverrides.communityId;
    // undefined means "not provided"; an explicit empty string clears the field.
    if (configOverrides.title !== undefined) normalized.configuration.instanceConfiguration.meta.title = configOverrides.title;
    if (configOverrides.description !== undefined) normalized.configuration.instanceConfiguration.meta.description = configOverrides.description;
    if (configOverrides.listType) normalized.configuration.instanceConfiguration.layout.listType = configOverrides.listType;
    if (configOverrides.sidebarPlacement) normalized.configuration.instanceConfiguration.layout.sidebar.placement = configOverrides.sidebarPlacement;
    return normalized;
  },

  /**
   * Title of a Hive community, or null when the lookup fails (callers fall back to a
   * generated title; creation must not fail on a flaky RPC).
   */
  async getCommunityTitle(communityId: string): Promise<string | null> {
    try {
      // Bounded: this runs inside signup/payment flows, so a slow RPC must degrade to the
      // generated fallback title instead of holding the request.
      const community = await Promise.race([
        callRPC('bridge.get_community', { name: communityId, observer: '' }),
        new Promise((resolve) => setTimeout(() => resolve(null), 4000)),
      ]) as any;
      const title = community?.title;
      return typeof title === 'string' && title.trim().length > 0 ? title.trim().slice(0, 100) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get default config for a new tenant.
   * `owner` is written into instanceConfiguration.owner, which the SPA reads for its ownership gate.
   */
  async getDefaultConfig(username: string, owner?: string): Promise<any> {
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
          imageProxy: 'https://i.ecency.com',
          profileBaseUrl: 'https://ecency.com/@',
          createPostUrl: 'https://ecency.com/publish',
          styles: {
            background: 'bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0]',
          },
        },
        instanceConfiguration: {
          type: 'blog',
          username: username,
          owner: (owner || username).toLowerCase(),
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
