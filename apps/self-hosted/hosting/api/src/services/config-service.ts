/**
 * Config Service
 *
 * Manages tenant config files on disk
 */

import { promises as fs } from 'fs';
import path from 'path';
import { TenantService, type Tenant } from './tenant-service';

const CONFIG_DIR = process.env.CONFIG_DIR || '/app/configs';

// Per-tenant write chains: every config-file write for a tenant runs strictly after the
// previous one, so the periodic sync and a concurrent tenant update can never interleave.
// Bounded by tenant count; entries are never removed (tiny, and removal would race).
const writeChains = new Map<string, Promise<void>>();

/**
 * Serialize an async operation per tenant. The next operation runs regardless of whether
 * the previous one failed; the caller still sees its own operation's result or error.
 */
export function withTenantWriteLock<T>(username: string, fn: () => Promise<T>): Promise<T> {
  const key = username.toLowerCase();
  const prev = writeChains.get(key) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  writeChains.set(
    key,
    run.then(
      () => undefined,
      () => undefined
    )
  );
  return run;
}

export const ConfigService = {
  /**
   * Generate config file for a tenant. Writes are serialized per tenant (see
   * withTenantWriteLock), so a sync-pass write and an update write cannot interleave.
   */
  generateConfigFile(tenant: Tenant): Promise<string> {
    return withTenantWriteLock(tenant.username, () => this.writeConfigFile(tenant));
  },

  /** The actual write; only ever invoked under the per-tenant lock. */
  async writeConfigFile(tenant: Tenant): Promise<string> {
    const configPath = this.getConfigPath(tenant.username);

    // Ensure directory exists
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    // Serve-time copy marks the instance as managed so the app enables managed-hosting
    // features (config saves) on any hostname, including verified custom domains where the
    // subdomain heuristic can't identify the tenant. Injected here rather than stored so
    // truly self-hosted configs can never carry it.
    const config = {
      ...tenant.config,
      configuration: {
        ...tenant.config?.configuration,
        instanceConfiguration: {
          ...tenant.config?.configuration?.instanceConfiguration,
          managed: true,
        },
      },
    };

    const content = JSON.stringify(config, null, 2);

    // Skip identical content so the periodic sync doesn't rewrite every file each pass.
    try {
      const existing = await fs.readFile(configPath, 'utf-8');
      if (existing === content) {
        return configPath;
      }
    } catch {
      // Missing or unreadable: write it.
    }

    await fs.writeFile(configPath, content, 'utf-8');

    console.log('[ConfigService] Generated config:', configPath);
    return configPath;
  },

  /**
   * Delete config file for a tenant. Serialized through the same per-tenant lock as
   * writes, so an in-flight sync write cannot resurrect the file after deletion.
   */
  deleteConfigFile(username: string): Promise<void> {
    return withTenantWriteLock(username, () => this.removeConfigFileUnlocked(username));
  },

  /** The actual unlink; only ever invoked under the per-tenant lock. */
  async removeConfigFileUnlocked(username: string): Promise<void> {
    const configPath = this.getConfigPath(username);

    try {
      await fs.unlink(configPath);
      console.log('[ConfigService] Deleted config:', configPath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  },

  /**
   * Read config file for a tenant
   */
  async readConfigFile(username: string): Promise<any | null> {
    const configPath = this.getConfigPath(username);

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(content);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  },

  /**
   * Check if config file exists
   */
  async configFileExists(username: string): Promise<boolean> {
    const configPath = this.getConfigPath(username);

    try {
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * List all config files
   */
  async listConfigFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(CONFIG_DIR);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch {
      return [];
    }
  },

  /**
   * Sync all tenant configs to disk
   */
  async syncAllConfigs(tenants: Tenant[]): Promise<void> {
    console.log('[ConfigService] Syncing', tenants.length, 'configs to disk...');

    // Per-tenant isolation: one bad write must not abort the rest of the rollout.
    let failed = 0;
    for (const tenant of tenants) {
      if (tenant.subscriptionStatus !== 'active') continue;
      try {
        // The pass iterates a snapshot, so the row is re-read INSIDE the per-tenant lock:
        // any update or deletion that enqueued its file operation first has fully finished
        // by the time this read runs, so the sync can never publish older data than what a
        // concurrent operation just wrote (a re-read before enqueueing would leave exactly
        // that window). The unlocked writer is used because the lock is not reentrant.
        // One query per active tenant per pass, fine at this scale.
        await withTenantWriteLock(tenant.username, async () => {
          const fresh = await TenantService.getByUsername(tenant.username);
          if (!fresh || fresh.subscriptionStatus !== 'active') return;
          await this.writeConfigFile(fresh);
        });
      } catch (err) {
        failed++;
        console.error(
          `[ConfigService] Sync failed for ${tenant.username}:`,
          (err as Error).message
        );
      }
    }

    console.log(
      failed
        ? `[ConfigService] Sync complete with ${failed} failure(s)`
        : '[ConfigService] Sync complete'
    );
  },

  /**
   * Get config file path for a username
   */
  getConfigPath(username: string): string {
    return path.join(CONFIG_DIR, username.toLowerCase() + '.json');
  },
};

export default ConfigService;
