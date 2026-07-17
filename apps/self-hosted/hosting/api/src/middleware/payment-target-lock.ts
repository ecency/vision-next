import { randomUUID } from 'node:crypto';
import type { Context, Next } from 'hono';
import { getRedisClient } from '../utils/redis';

// A paid x402 request can spend up to 30 seconds in facilitator verify + settle. The lease is
// renewed while the route remains active and still expires automatically if this process dies.
const PAYMENT_TARGET_LOCK_TTL_MS = 120_000;
const PAYMENT_TARGET_LOCK_REFRESH_MS = 15_000;

const REFRESH_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("pexpire", KEYS[1], ARGV[2])
  end
  return 0
`;

const RELEASE_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  end
  return 0
`;

/**
 * Serialize an x402 operation for one tenant across API replicas.
 *
 * The lock must wrap both the unpaid eligibility check and the paywall. A competing request is
 * rejected before it reaches settlement, so it cannot pay and then lose a tenant/plan race in the
 * post-settlement transaction. A token-checked heartbeat keeps long-running requests covered; the
 * random token also makes refresh and release ownership-safe if a stale lock ever expires and
 * another request acquires the same key.
 */
export async function withPaymentTargetLock(
  c: Context,
  next: Next,
  operation: 'subscribe' | 'upgrade',
  target: string
): Promise<Response | void> {
  const key = `lock:x402:${operation}:${target.trim().toLowerCase()}`;
  const token = randomUUID();
  let client: Awaited<ReturnType<typeof getRedisClient>>;

  try {
    client = await getRedisClient();
    const acquired = await client.set(key, token, { NX: true, PX: PAYMENT_TARGET_LOCK_TTL_MS });
    if (acquired !== 'OK') {
      return c.json({ error: 'Payment operation already in progress', retryable: true }, 409);
    }
  } catch (error) {
    // Fail closed before the paywall: proceeding without the reservation could settle a payment
    // that the post-settlement tenant mutation then rejects.
    console.error(
      '[PaymentTargetLock] Failed to reserve payment target:',
      (error as Error).message
    );
    return c.json({ error: 'Unable to reserve payment operation', retryable: true }, 503);
  }

  let refreshRunning = false;
  const refreshTimer = setInterval(() => {
    if (refreshRunning) return;
    refreshRunning = true;
    void client
      .eval(REFRESH_LOCK_SCRIPT, {
        keys: [key],
        arguments: [token, String(PAYMENT_TARGET_LOCK_TTL_MS)],
      })
      .then((renewed) => {
        if (renewed !== 1) {
          console.error('[PaymentTargetLock] Lost payment target lease:', key);
        }
      })
      .catch((error) => {
        // The existing lease remains valid and the next heartbeat retries. The two-minute TTL
        // leaves ample margin over the paywall's bounded 30-second facilitator window.
        console.error(
          '[PaymentTargetLock] Failed to refresh payment target:',
          (error as Error).message
        );
      })
      .finally(() => {
        refreshRunning = false;
      });
  }, PAYMENT_TARGET_LOCK_REFRESH_MS);
  refreshTimer.unref?.();

  try {
    await next();
  } finally {
    clearInterval(refreshTimer);
    try {
      await client.eval(RELEASE_LOCK_SCRIPT, { keys: [key], arguments: [token] });
    } catch (error) {
      // The TTL is the final recovery mechanism; never replace the real route response merely
      // because eager cleanup failed.
      console.error(
        '[PaymentTargetLock] Failed to release payment target:',
        (error as Error).message
      );
    }
  }
}
