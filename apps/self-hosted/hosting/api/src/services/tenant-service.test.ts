import { describe, it, expect } from 'vitest';
import { TenantService } from './tenant-service';

// These exercise the pure config builders only (no DB / no RPC), which is where the
// owner (controlling account) is resolved and written into the stored config.

describe('TenantService.getDefaultConfig owner', () => {
  it('defaults owner to the showcased username when no owner is given', async () => {
    const config = await TenantService.getDefaultConfig('alice');
    expect(config.configuration.instanceConfiguration.owner).toBe('alice');
    expect(config.configuration.instanceConfiguration.username).toBe('alice');
  });

  it('uses the given owner and lowercases it', async () => {
    const config = await TenantService.getDefaultConfig('hive-125125', 'Alice');
    expect(config.configuration.instanceConfiguration.owner).toBe('alice');
    expect(config.configuration.instanceConfiguration.username).toBe('hive-125125');
  });
});

describe('TenantService.buildConfig owner + community', () => {
  it('keeps owner defaulted to username with no overrides', async () => {
    const config = await TenantService.buildConfig('bob');
    expect(config.configuration.instanceConfiguration.owner).toBe('bob');
    expect(config.configuration.instanceConfiguration.type).toBe('blog');
  });

  it('sets owner alongside a community override (owner decoupled from showcased account)', async () => {
    const config = await TenantService.buildConfig(
      'hive-125125',
      { type: 'community', communityId: 'hive-125125', title: 'My Community' },
      'alice'
    );
    const instance = config.configuration.instanceConfiguration;
    expect(instance.owner).toBe('alice');
    expect(instance.username).toBe('hive-125125');
    expect(instance.type).toBe('community');
    expect(instance.communityId).toBe('hive-125125');
    expect(instance.meta.title).toBe('My Community');
  });

  it('never lets a client override the server-resolved owner via configOverrides', async () => {
    const config = await TenantService.buildConfig(
      'bob',
      { owner: 'attacker' } as any,
      'bob'
    );
    expect(config.configuration.instanceConfiguration.owner).toBe('bob');
  });
});
