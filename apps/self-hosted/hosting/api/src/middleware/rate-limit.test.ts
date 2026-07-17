import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getRedisClient: vi.fn(),
  eval: vi.fn(),
}));

vi.mock('../utils/redis', () => ({
  getRedisClient: mocks.getRedisClient,
}));

const { rateLimit } = await import('./rate-limit');

function makeCtx(ip = '1.2.3.4') {
  const headers: Record<string, string> = { 'x-forwarded-for': ip };
  const resHeaders: Record<string, string> = {};
  return {
    req: { header: (k: string) => headers[k.toLowerCase()] },
    header: (k: string, v: string) => {
      resHeaders[k] = v;
    },
    json: (body: unknown, status?: number) => ({ body, status: status ?? 200 }),
    _resHeaders: resHeaders,
  } as any;
}

describe('rateLimit', () => {
  beforeEach(() => {
    mocks.getRedisClient.mockReset().mockResolvedValue({ eval: mocks.eval });
    mocks.eval.mockReset();
  });

  it('allows requests under the limit and blocks over it with 429', async () => {
    const mw = rateLimit({ name: 'test', limit: 3, windowMs: 60_000 });
    const next = vi.fn();

    mocks.eval.mockResolvedValueOnce(1);
    await mw(makeCtx(), next);
    expect(next).toHaveBeenCalledTimes(1);

    mocks.eval.mockResolvedValueOnce(4); // over limit
    const ctx = makeCtx();
    const res = await mw(ctx, next);
    expect(next).toHaveBeenCalledTimes(1); // not called again
    expect(res.status).toBe(429);
    expect(ctx._resHeaders['Retry-After']).toBe('60');
  });

  it('allows exactly at the limit boundary', async () => {
    const mw = rateLimit({ name: 'test', limit: 3, windowMs: 60_000 });
    const next = vi.fn();
    mocks.eval.mockResolvedValueOnce(3);
    await mw(makeCtx(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('fails OPEN when Redis is unavailable', async () => {
    const mw = rateLimit({ name: 'test', limit: 1, windowMs: 60_000 });
    const next = vi.fn();
    mocks.getRedisClient.mockRejectedValueOnce(new Error('redis down'));
    await mw(makeCtx(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('keys by the first x-forwarded-for entry', async () => {
    const mw = rateLimit({ name: 'test', limit: 5, windowMs: 60_000 });
    mocks.eval.mockResolvedValue(1);
    await mw(makeCtx('9.9.9.9, 10.0.0.1'), vi.fn());
    const call = mocks.eval.mock.calls[0][1];
    expect(call.keys[0]).toBe('rl:test:9.9.9.9');
  });
});
