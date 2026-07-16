import { mkdtempSync } from 'fs';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';

// CONFIG_DIR is read at module load; point it at a temp dir BEFORE importing the service.
process.env.CONFIG_DIR = mkdtempSync(path.join(tmpdir(), 'hosting-cfg-'));
const { ConfigService, withTenantWriteLock } = await import('./config-service');

const tenant = (username: string, title: string) =>
  ({
    username,
    config: {
      version: 1,
      configuration: {
        general: { theme: 'system' },
        instanceConfiguration: { username, meta: { title } },
      },
    },
  }) as any;

describe('withTenantWriteLock', () => {
  it('serializes operations per tenant, in submission order', async () => {
    const order: string[] = [];
    const slow = withTenantWriteLock('alice', async () => {
      await new Promise((r) => setTimeout(r, 30));
      order.push('first');
    });
    const fast = withTenantWriteLock('alice', async () => {
      order.push('second');
    });
    await Promise.all([slow, fast]);
    expect(order).toEqual(['first', 'second']);
  });

  it('runs the next operation even when the previous one failed', async () => {
    const failing = withTenantWriteLock('bob', async () => {
      throw new Error('boom');
    });
    await expect(failing).rejects.toThrow('boom');
    await expect(withTenantWriteLock('bob', async () => 'ok')).resolves.toBe('ok');
  });
});

describe('ConfigService.generateConfigFile', () => {
  it('writes the config with the managed flag injected and repairs drift', async () => {
    const configPath = await ConfigService.generateConfigFile(tenant('carol', 'One'));
    const written = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    expect(written.configuration.instanceConfiguration.managed).toBe(true);
    expect(written.configuration.instanceConfiguration.meta.title).toBe('One');

    // External drift is repaired on the next pass.
    await fs.writeFile(configPath, '{"tampered":true}', 'utf-8');
    await ConfigService.generateConfigFile(tenant('carol', 'One'));
    const repaired = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    expect(repaired.configuration.instanceConfiguration.meta.title).toBe('One');
  });

  it('a newer write is not clobbered by an older concurrent write', async () => {
    // Simulates the sync-vs-update race: an older (slow) generation submitted first and a
    // newer one submitted second must finish with the newer content on disk.
    const oldWrite = ConfigService.generateConfigFile(tenant('dave', 'stale'));
    const newWrite = ConfigService.generateConfigFile(tenant('dave', 'fresh'));
    await Promise.all([oldWrite, newWrite]);

    const onDisk = JSON.parse(
      await fs.readFile(ConfigService.getConfigPath('dave'), 'utf-8')
    );
    expect(onDisk.configuration.instanceConfiguration.meta.title).toBe('fresh');
  });
});
