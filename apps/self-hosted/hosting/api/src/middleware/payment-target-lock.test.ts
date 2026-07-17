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
      async (script: string, options: { keys: string[]; arguments: string[] }) => {
        const [key] = options.keys;
        const [token] = options.arguments;
        if (locks.get(key) !== token) return 0;
        if (script.includes('pexpire')) return 1;
        locks.delete(key);
        return 1;
      }
    );
  });

  it('serializes unpaid create and paid subscribe before settlement', async () => {
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
      '/create',
      (c, next) => withPaymentTargetLock(c, next, 'subscribe', 'alice'),
      async (c) => {
        downstreamCalls++;
        signalEntered();
        await holdFirst;
        return c.json({ ok: true });
      }
    );
    app.post(
      '/subscribe',
      (c, next) => withPaymentTargetLock(c, next, 'subscribe', 'alice'),
      (c) => {
        downstreamCalls++;
        return c.json({ ok: true });
      }
    );

    const first = app.request('/create', { method: 'POST' });
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

  it('renews the lease while downstream work remains active', async () => {
    vi.useFakeTimers();
    const app = new Hono();
    let signalEntered!: () => void;
    let releaseRequest!: () => void;
    const entered = new Promise<void>((resolve) => {
      signalEntered = resolve;
    });
    const holdRequest = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    app.post(
      '/subscribe',
      (c, next) => withPaymentTargetLock(c, next, 'subscribe', 'alice'),
      async (c) => {
        signalEntered();
        await holdRequest;
        return c.json({ ok: true });
      }
    );

    try {
      const request = app.request('/subscribe', { method: 'POST' });
      await entered;
      await vi.advanceTimersByTimeAsync(15_000);

      expect(redis.eval).toHaveBeenCalledWith(
        expect.stringContaining('pexpire'),
        expect.objectContaining({ keys: ['lock:x402:subscribe:alice'] })
      );

      releaseRequest();
      expect((await request).status).toBe(200);
    } finally {
      releaseRequest?.();
      vi.useRealTimers();
    }
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
