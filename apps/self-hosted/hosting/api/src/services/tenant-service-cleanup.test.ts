import { beforeEach, describe, expect, it, vi } from 'vitest';

// deleteAbandonedTenants issues one parameterized DELETE ... RETURNING; assert the query shape
// (status + grace-window + no-payments guards) and that it returns the freed usernames.
const mocks = vi.hoisted(() => ({ queryAll: vi.fn() }));

vi.mock('../db/client', () => ({
  db: { queryAll: mocks.queryAll },
}));
vi.mock('@ecency/sdk/hive', () => ({
  callRPC: vi.fn(),
  config: { nodes: [] },
  setNodes: vi.fn(),
}));

const { TenantService } = await import('./tenant-service');

describe('TenantService.deleteAbandonedTenants', () => {
  beforeEach(() => mocks.queryAll.mockReset());

  it('deletes only inactive, unpaid, past-grace tenants and returns the freed usernames', async () => {
    mocks.queryAll.mockResolvedValueOnce([{ username: 'demo' }, { username: 'test' }]);

    const deleted = await TenantService.deleteAbandonedTenants(7);

    expect(deleted).toEqual(['demo', 'test']);
    const [sql, params] = mocks.queryAll.mock.calls[0];
    expect(sql).toMatch(/DELETE FROM tenants/i);
    expect(sql).toMatch(/subscription_status = 'inactive'/);
    expect(sql).toMatch(/created_at < NOW\(\) - \(\$1 \* INTERVAL '1 day'\)/);
    expect(sql).toMatch(/NOT IN \(SELECT tenant_id FROM payments/i);
    expect(params).toEqual([7]);
  });

  it('returns an empty array when nothing is abandoned', async () => {
    mocks.queryAll.mockResolvedValueOnce([]);
    await expect(TenantService.deleteAbandonedTenants(7)).resolves.toEqual([]);
  });
});
