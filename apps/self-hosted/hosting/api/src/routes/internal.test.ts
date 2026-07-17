import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getByUsername: vi.fn(),
  generateConfigFile: vi.fn(),
}));

vi.mock('../db/client', () => ({
  db: { transaction: mocks.transaction },
}));

vi.mock('../services/tenant-service', () => ({
  TenantService: {
    getByUsername: mocks.getByUsername,
  },
}));

vi.mock('../services/config-service', () => ({
  ConfigService: {
    generateConfigFile: mocks.generateConfigFile,
  },
}));

const { internalRoutes } = await import('./internal');

describe('POST /activate config publication', () => {
  beforeEach(() => {
    process.env.HOSTING_INTERNAL_SECRET = 'test-secret';
    mocks.transaction.mockReset().mockResolvedValue({
      status: 200,
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      plan: 'standard',
    });
    mocks.getByUsername.mockReset().mockResolvedValue({
      username: 'alice',
      subscriptionStatus: 'active',
    });
    mocks.generateConfigFile.mockReset().mockResolvedValue('/configs/alice.json');
  });

  const activate = () =>
    internalRoutes.request('/activate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-secret': 'test-secret',
      },
      body: JSON.stringify({
        username: 'alice',
        payer: 'alice',
        months: 1,
        order_id: 'order-1',
        amount_usd: 2,
      }),
    });

  it('returns a retryable server error when the served config cannot be published', async () => {
    mocks.generateConfigFile.mockRejectedValueOnce(new Error('disk unavailable'));

    const response = await activate();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'activation_failed' });
  });

  it('acknowledges activation only after config publication succeeds', async () => {
    const response = await activate();

    expect(response.status).toBe(200);
    expect(mocks.generateConfigFile).toHaveBeenCalledTimes(1);
    expect(await response.json()).toMatchObject({ activated: true, plan: 'standard' });
  });
});
