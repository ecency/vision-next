/**
 * Config Service
 *
 * Manages tenant config files on disk
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { Tenant } from './tenant-service';

const CONFIG_DIR = process.env.CONFIG_DIR || '/app/configs';

export const ConfigService = {
  /**
   * Generate config file for a tenant
   */
  async generateConfigFile(tenant: Tenant): Promise<string> {
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

    // Write config file
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

    console.log('[ConfigService] Generated config:', configPath);
    return configPath;
  },

  /**
   * Delete config file for a tenant
   */
  async deleteConfigFile(username: string): Promise<void> {
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
        await this.generateConfigFile(tenant);
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
