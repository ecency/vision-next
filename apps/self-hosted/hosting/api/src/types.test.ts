import { describe, it, expect } from 'vitest';
import {
  parseMemo,
  mapTenantFromDb,
  mapTenantToDb,
  type TenantRow,
  type Tenant,
} from './types';

// =============================================================================
// parseMemo
// =============================================================================

describe('parseMemo', () => {
  it('parses "blog:username" as 1-month subscription', () => {
    const result = parseMemo('blog:alice');
    expect(result).toEqual({ action: 'blog', username: 'alice', months: 1 });
  });

  it('parses "blog:username:months" with explicit months', () => {
    const result = parseMemo('blog:bob:6');
    expect(result).toEqual({ action: 'blog', username: 'bob', months: 6 });
  });

  it('parses "blog:username:12" for a yearly subscription', () => {
    const result = parseMemo('blog:charlie:12');
    expect(result).toEqual({ action: 'blog', username: 'charlie', months: 12 });
  });

  it('defaults months to 1 when the months segment is non-numeric', () => {
    const result = parseMemo('blog:dave:abc');
    expect(result).toEqual({ action: 'blog', username: 'dave', months: 1 });
  });

  it('handles uppercase memos by lowercasing', () => {
    const result = parseMemo('BLOG:Alice');
    expect(result).toEqual({ action: 'blog', username: 'alice', months: 1 });
  });

  it('trims whitespace around the memo', () => {
    const result = parseMemo('  blog:alice  ');
    expect(result).toEqual({ action: 'blog', username: 'alice', months: 1 });
  });

  it('parses "upgrade:username"', () => {
    const result = parseMemo('upgrade:alice');
    expect(result).toEqual({ action: 'upgrade', username: 'alice', months: 1 });
  });

  it('returns unknown for empty string', () => {
    const result = parseMemo('');
    expect(result).toEqual({ action: 'unknown', username: '', months: 0 });
  });

  it('returns unknown for random text', () => {
    const result = parseMemo('hello world');
    expect(result).toEqual({ action: 'unknown', username: '', months: 0 });
  });

  it('returns unknown when action is "blog" but username is missing', () => {
    const result = parseMemo('blog:');
    expect(result).toEqual({ action: 'unknown', username: '', months: 0 });
  });

  it('returns unknown when action is "upgrade" but username is missing', () => {
    const result = parseMemo('upgrade:');
    expect(result).toEqual({ action: 'unknown', username: '', months: 0 });
  });

  it('returns unknown for unrecognized action', () => {
    const result = parseMemo('refund:alice');
    expect(result).toEqual({ action: 'unknown', username: '', months: 0 });
  });

  it('defaults months to 1 when months is 0', () => {
    const result = parseMemo('blog:alice:0');
    expect(result).toEqual({ action: 'blog', username: 'alice', months: 1 });
  });

  it('defaults negative months to 1', () => {
    const result = parseMemo('blog:alice:-1');
    expect(result).toEqual({ action: 'blog', username: 'alice', months: 1 });
  });
});

// =============================================================================
// mapTenantFromDb
// =============================================================================

describe('mapTenantFromDb', () => {
  const baseRow: TenantRow = {
    id: '123',
    username: 'alice',
    subscription_status: 'active',
    subscription_plan: 'standard',
    subscription_started_at: '2025-01-01T00:00:00Z',
    subscription_expires_at: '2025-02-01T00:00:00Z',
    custom_domain: 'alice.blog',
    custom_domain_verified: true,
    custom_domain_verified_at: '2025-01-05T00:00:00Z',
    config: { version: 1 },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  it('maps snake_case fields to camelCase', () => {
    const tenant = mapTenantFromDb(baseRow);
    expect(tenant.id).toBe('123');
    expect(tenant.username).toBe('alice');
    expect(tenant.subscriptionStatus).toBe('active');
    expect(tenant.subscriptionPlan).toBe('standard');
    expect(tenant.customDomain).toBe('alice.blog');
    expect(tenant.customDomainVerified).toBe(true);
  });

  it('converts date strings to Date objects', () => {
    const tenant = mapTenantFromDb(baseRow);
    expect(tenant.subscriptionStartedAt).toBeInstanceOf(Date);
    expect(tenant.subscriptionExpiresAt).toBeInstanceOf(Date);
    expect(tenant.customDomainVerifiedAt).toBeInstanceOf(Date);
    expect(tenant.createdAt).toBeInstanceOf(Date);
    expect(tenant.updatedAt).toBeInstanceOf(Date);
  });

  it('handles null date fields', () => {
    const row: TenantRow = {
      ...baseRow,
      subscription_started_at: null,
      subscription_expires_at: null,
      custom_domain: null,
      custom_domain_verified: false,
      custom_domain_verified_at: null,
    };
    const tenant = mapTenantFromDb(row);
    expect(tenant.subscriptionStartedAt).toBeNull();
    expect(tenant.subscriptionExpiresAt).toBeNull();
    expect(tenant.customDomain).toBeNull();
    expect(tenant.customDomainVerifiedAt).toBeNull();
  });

  it('preserves the config object as-is', () => {
    const tenant = mapTenantFromDb(baseRow);
    expect(tenant.config).toEqual({ version: 1 });
  });
});

// =============================================================================
// mapTenantToDb
// =============================================================================

describe('mapTenantToDb', () => {
  it('maps camelCase to snake_case for all fields', () => {
    const partial: Partial<Tenant> = {
      username: 'bob',
      subscriptionStatus: 'active',
      subscriptionPlan: 'pro',
    };
    const dbFields = mapTenantToDb(partial);
    expect(dbFields).toEqual({
      username: 'bob',
      subscription_status: 'active',
      subscription_plan: 'pro',
    });
  });

  it('only includes fields that are defined', () => {
    const dbFields = mapTenantToDb({ username: 'bob' });
    expect(Object.keys(dbFields)).toEqual(['username']);
  });

  it('JSON.stringifies the config field', () => {
    const partial: Partial<Tenant> = {
      config: { version: 1 } as any,
    };
    const dbFields = mapTenantToDb(partial);
    expect(dbFields.config).toBe(JSON.stringify({ version: 1 }));
  });

  it('returns empty object when nothing is set', () => {
    const dbFields = mapTenantToDb({});
    expect(dbFields).toEqual({});
  });
});
