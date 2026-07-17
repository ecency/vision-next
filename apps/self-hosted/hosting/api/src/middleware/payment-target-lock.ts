import { randomUUID } from 'node:crypto';
import type { Context, Next } from 'hono';
import { getRedisClient } from '../utils/redis';

// A paid x402 request can spend up to 30 seconds in facilitator verify + settle. Keep the
// reservation beyond that window, but let Redis recover it automatically if this process dies.
const PAYMENT_TARGET_LOCK_TTL_MS = 60_000;

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
 * post-settlement transaction. The random token makes release ownership-safe if a stale lock ever
 * expires and another request acquires the same key.
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

  try {
    await next();
  } finally {
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
