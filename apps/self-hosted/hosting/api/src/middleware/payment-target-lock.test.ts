import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const redis = vi.hoisted(() => ({
  set: vi.fn(),
  eval: vi.fn(),
}));

vi.mock('../utils/redis', () => ({
  getRedisClient: vi.fn(async () => redis),
}));

const { withPaymentTargetLock } = await import('./payment-target-lock');

describe('withPaymentTargetLock', () => {
  const locks = new Map<string, string>();

  beforeEach(() => {
    locks.clear();
    redis.set.mockReset().mockImplementation(async (key: string, token: string) => {
      if (locks.has(key)) return null;
      locks.set(key, token);
      return 'OK';
    });
    redis.eval.mockReset().mockImplementation(
      async (_script: string, options: { keys: string[]; arguments: string[] }) => {
        const [key] = options.keys;
        const [token] = options.arguments;
        if (locks.get(key) !== token) return 0;
        locks.delete(key);
        return 1;
      }
    );
  });

  it('rejects a competing request before it reaches settlement', async () => {
    const app = new Hono();
    let downstreamCalls = 0;
    let signalEntered!: () => void;
    let releaseFirst!: () => void;
    const entered = new Promise<void>((resolve) => {
      signalEntered = resolve;
    });
    const holdFirst = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    app.post(
      '/subscribe',
      (c, next) => withPaymentTargetLock(c, next, 'subscribe', 'alice'),
      async (c) => {
        downstreamCalls++;
        signalEntered();
        await holdFirst;
        return c.json({ ok: true });
      }
    );

    const first = app.request('/subscribe', { method: 'POST' });
    await entered;

    const competing = await app.request('/subscribe', { method: 'POST' });
    expect(competing.status).toBe(409);
    expect(await competing.json()).toEqual({
      error: 'Payment operation already in progress',
      retryable: true,
    });
    expect(downstreamCalls).toBe(1);

    releaseFirst();
    expect((await first).status).toBe(200);
    expect(locks.size).toBe(0);
  });

  it('fails closed when Redis cannot reserve the target', async () => {
    redis.set.mockRejectedValueOnce(new Error('redis unavailable'));
    const app = new Hono();
    let downstreamCalled = false;

    app.post(
      '/upgrade',
      (c, next) => withPaymentTargetLock(c, next, 'upgrade', 'alice'),
      (c) => {
        downstreamCalled = true;
        return c.json({ ok: true });
      }
    );

    const response = await app.request('/upgrade', { method: 'POST' });
    expect(response.status).toBe(503);
    expect(downstreamCalled).toBe(false);
  });
});
