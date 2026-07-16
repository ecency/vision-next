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

  it('gives a community instance community post filters, not blog ones', async () => {
    const config = await TenantService.buildConfig(
      'hive-125125',
      { type: 'community', communityId: 'hive-125125', title: 'My Community' },
      'alice'
    );
    expect(config.configuration.instanceConfiguration.features.postsFilters).toEqual([
      'trending',
      'hot',
      'created',
    ]);
  });

  it('keeps blog post filters for a personal blog', async () => {
    const config = await TenantService.buildConfig('bob', { title: 'My Blog' }, 'bob');
    expect(config.configuration.instanceConfiguration.features.postsFilters).toEqual([
      'posts',
      'blog',
    ]);
  });
});

describe('TenantService.normalizeFlatOverrides', () => {
  it('maps every flat key to its nested config path', () => {
    const normalized = TenantService.normalizeFlatOverrides({
      theme: 'dark',
      styleTemplate: 'minimal',
      title: 'T',
      description: 'D',
      listType: 'grid',
      sidebarPlacement: 'left',
    });
    expect(normalized.configuration.general.theme).toBe('dark');
    expect(normalized.configuration.general.styleTemplate).toBe('minimal');
    expect(normalized.configuration.instanceConfiguration.meta.title).toBe('T');
    expect(normalized.configuration.instanceConfiguration.meta.description).toBe('D');
    expect(normalized.configuration.instanceConfiguration.layout.listType).toBe('grid');
    expect(normalized.configuration.instanceConfiguration.layout.sidebar.placement).toBe('left');
  });
});

describe('TenantService.sanitizeConfigDocument', () => {
  const pins = {
    version: 1,
    username: 'hive-125125',
    owner: 'alice',
    type: 'community',
    communityId: 'hive-125125',
  };

  it('pins identity fields no matter what the client sent', () => {
    const clean = TenantService.sanitizeConfigDocument(
      {
        version: 99,
        configuration: {
          general: { theme: 'dark' },
          instanceConfiguration: {
            username: 'attacker',
            owner: 'attacker',
            type: 'blog',
            communityId: '',
            meta: { title: 'New title' },
          },
        },
      },
      pins
    );
    expect(clean.version).toBe(1);
    expect(clean.configuration.instanceConfiguration.username).toBe('hive-125125');
    expect(clean.configuration.instanceConfiguration.owner).toBe('alice');
    expect(clean.configuration.instanceConfiguration.type).toBe('community');
    expect(clean.configuration.instanceConfiguration.communityId).toBe('hive-125125');
    expect(clean.configuration.instanceConfiguration.meta.title).toBe('New title');
    expect(clean.configuration.general.theme).toBe('dark');
  });

  it('rejects a document without a configuration object', () => {
    expect(() => TenantService.sanitizeConfigDocument({ version: 1 }, pins)).toThrow(
      'Invalid configuration document'
    );
  });

  it('drops prototype pollution vectors', () => {
    const clean = TenantService.sanitizeConfigDocument(
      JSON.parse('{"configuration":{"__proto__":{"polluted":true},"general":{}}}'),
      pins
    );
    expect(({} as any).polluted).toBeUndefined();
    expect(clean.configuration.general).toBeDefined();
  });

  it('nulled sections cannot erase stored configuration', async () => {
    // A document carrying nulls (hand-crafted API call or a buggy client) must not wipe the
    // sections it nulls: mergeConfig treats null as a replacement value, so sanitize strips it.
    const stored = await TenantService.buildConfig('bob', { title: 'Kept title' }, 'bob');
    const hostile = {
      configuration: {
        general: null,
        instanceConfiguration: { meta: { title: null, description: 'New desc' } },
      },
    };
    const clean = TenantService.sanitizeConfigDocument(hostile, {
      version: 1,
      username: 'bob',
      owner: 'bob',
      type: 'blog',
      communityId: '',
    });
    const merged = TenantService.mergeConfig(stored, clean);

    expect(merged.configuration.general.theme).toBe('system');
    expect(merged.configuration.general.imageProxy).toBe('https://i.ecency.com');
    expect(merged.configuration.instanceConfiguration.meta.title).toBe('Kept title');
    expect(merged.configuration.instanceConfiguration.meta.description).toBe('New desc');
  });

  it('strips null entries inside arrays', () => {
    const clean = TenantService.sanitizeConfigDocument(
      {
        configuration: {
          instanceConfiguration: { features: { postsFilters: ['trending', null, 'hot'] } },
        },
      },
      pins
    );
    expect(clean.configuration.instanceConfiguration.features.postsFilters).toEqual([
      'trending',
      'hot',
    ]);
  });

  it('merged into the stored config, a partial document cannot erase other sections', async () => {
    // Mirrors applyConfigDocument: sanitize the client document, then deep-merge it into the
    // stored config. A document carrying only one section must leave the rest intact.
    const stored = await TenantService.buildConfig('bob', { title: 'Kept title' }, 'bob');
    const partial = { configuration: { general: { theme: 'dark' } } };
    const clean = TenantService.sanitizeConfigDocument(partial, {
      version: 1,
      username: 'bob',
      owner: 'bob',
      type: 'blog',
      communityId: '',
    });
    const merged = TenantService.mergeConfig(stored, clean);

    expect(merged.configuration.general.theme).toBe('dark');
    expect(merged.configuration.instanceConfiguration.meta.title).toBe('Kept title');
    expect(merged.configuration.instanceConfiguration.features.postsFilters).toEqual([
      'posts',
      'blog',
    ]);
    expect(merged.configuration.general.imageProxy).toBe('https://i.ecency.com');
  });
});
