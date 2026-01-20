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

    // Write config file
    await fs.writeFile(configPath, JSON.stringify(tenant.config, null, 2), 'utf-8');

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

    for (const tenant of tenants) {
      if (tenant.subscription_status === 'active') {
        await this.generateConfigFile(tenant);
      }
    }

    console.log('[ConfigService] Sync complete');
  },

  /**
   * Get config file path for a username
   */
  getConfigPath(username: string): string {
    return path.join(CONFIG_DIR, username.toLowerCase() + '.json');
  },
};

export default ConfigService;
