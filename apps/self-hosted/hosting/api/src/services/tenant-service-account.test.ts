import { beforeEach, describe, expect, it, vi } from 'vitest';

// accountExistsStrict / verifyHiveAccount call callRPC from @ecency/sdk/hive. Mock it so we can
// drive the four outcomes that decide permanent-vs-retryable payment handling in the listener.
const mocks = vi.hoisted(() => ({ callRPC: vi.fn() }));

vi.mock('@ecency/sdk/hive', () => ({
  callRPC: mocks.callRPC,
  config: { nodes: [] },
  setNodes: vi.fn(),
}));

const { TenantService } = await import('./tenant-service');

describe('TenantService.accountExistsStrict', () => {
  beforeEach(() => mocks.callRPC.mockReset());

  it('returns true when the account is found', async () => {
    mocks.callRPC.mockResolvedValueOnce([{ name: 'alice' }]);
    await expect(TenantService.accountExistsStrict('alice')).resolves.toBe(true);
  });

  it('returns false when the account is definitively absent (empty array)', async () => {
    mocks.callRPC.mockResolvedValueOnce([]);
    await expect(TenantService.accountExistsStrict('nope')).resolves.toBe(false);
  });

  it('THROWS on a malformed (non-array) response instead of reporting absent', async () => {
    mocks.callRPC.mockResolvedValueOnce(null);
    await expect(TenantService.accountExistsStrict('alice')).rejects.toThrow();
  });

  it('THROWS on an RPC/transport rejection (so the listener retries, not fails)', async () => {
    mocks.callRPC.mockRejectedValueOnce(new Error('ECONNRESET'));
    await expect(TenantService.accountExistsStrict('alice')).rejects.toThrow('ECONNRESET');
  });
});

describe('TenantService.verifyHiveAccount (best-effort boolean)', () => {
  beforeEach(() => mocks.callRPC.mockReset());

  it('is true when found', async () => {
    mocks.callRPC.mockResolvedValueOnce([{ name: 'alice' }]);
    await expect(TenantService.verifyHiveAccount('alice')).resolves.toBe(true);
  });

  it('swallows an RPC error to false (unlike the strict variant)', async () => {
    mocks.callRPC.mockRejectedValueOnce(new Error('down'));
    await expect(TenantService.verifyHiveAccount('alice')).resolves.toBe(false);
  });
});
