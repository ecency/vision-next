import { beforeEach, describe, expect, it, vi } from 'vitest';

// reclaimAbandonedTenants SOFT-deletes: one parameterized UPDATE ... SET status='abandoned'
// ... RETURNING. Assert the query shape (it marks, never DELETEs; keeps the status + grace-window
// + no-payments guards) and that it returns the reclaimed usernames. create() upserts so a
// reclaimed username can be reserved again — assert it revives an 'abandoned' row and reports a
// conflict when a live tenant holds the name.
const mocks = vi.hoisted(() => ({ queryAll: vi.fn(), queryOne: vi.fn() }));

vi.mock('../db/client', () => ({
  db: { queryAll: mocks.queryAll, queryOne: mocks.queryOne },
}));
vi.mock('@ecency/sdk/hive', () => ({
  callRPC: vi.fn(),
  config: { nodes: [] },
  setNodes: vi.fn(),
}));

const { TenantService } = await import('./tenant-service');

describe('TenantService.reclaimAbandonedTenants', () => {
  beforeEach(() => mocks.queryAll.mockReset());

  it('marks (not deletes) only inactive, unpaid, past-grace tenants and returns the freed usernames', async () => {
    mocks.queryAll.mockResolvedValueOnce([{ username: 'demo' }, { username: 'test' }]);

    const reclaimed = await TenantService.reclaimAbandonedTenants(7);

    expect(reclaimed).toEqual(['demo', 'test']);
    const [sql, params] = mocks.queryAll.mock.calls[0];
    // Soft delete: it must UPDATE to 'abandoned', never DELETE the row (a deleted row can't be
    // revived by an in-flight payment).
    expect(sql).toMatch(/UPDATE tenants/i);
    expect(sql).not.toMatch(/DELETE/i);
    expect(sql).toMatch(/SET subscription_status = 'abandoned'/);
    expect(sql).toMatch(/subscription_status = 'inactive'/); // still only targets inactive rows
    expect(sql).toMatch(/created_at < NOW\(\) - \(\$1 \* INTERVAL '1 day'\)/);
    expect(sql).toMatch(/NOT IN \(SELECT tenant_id FROM payments/i);
    expect(params).toEqual([7]);
  });

  it('returns an empty array when nothing is abandoned', async () => {
    mocks.queryAll.mockResolvedValueOnce([]);
    await expect(TenantService.reclaimAbandonedTenants(7)).resolves.toEqual([]);
  });
});

describe('TenantService.create (revives abandoned reservations)', () => {
  beforeEach(() => {
    mocks.queryOne.mockReset();
    mocks.queryAll.mockReset();
  });

  it('upserts with a DO UPDATE gated on the abandoned status (so a live row is never overwritten)', async () => {
    mocks.queryOne.mockResolvedValueOnce({
      id: '1',
      username: 'demo',
      owner: 'demo',
      subscription_status: 'inactive',
      subscription_plan: 'standard',
      config: {},
    });

    await TenantService.create('demo', 'demo', undefined);

    // A personal blog with no overrides makes no other queryOne calls, so the upsert is call 0.
    const [sql] = mocks.queryOne.mock.calls[mocks.queryOne.mock.calls.length - 1];
    expect(sql).toMatch(/INSERT INTO tenants/i);
    expect(sql).toMatch(/ON CONFLICT \(username\) DO UPDATE/i);
    expect(sql).toMatch(/WHERE tenants\.subscription_status = 'abandoned'/);
  });

  it('throws a conflict when the upsert returns no row (a live tenant holds the name)', async () => {
    mocks.queryOne.mockResolvedValueOnce(null); // DO UPDATE WHERE abandoned matched nothing

    await expect(TenantService.create('demo', 'demo', undefined)).rejects.toMatchObject({
      isConflict: true,
    });
  });
});
