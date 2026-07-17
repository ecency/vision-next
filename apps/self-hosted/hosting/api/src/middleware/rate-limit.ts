/**
 * Redis-backed per-IP rate limiting.
 *
 * The public API has no auth on tenant creation or the auth challenge, so without a limit a
 * single client can fill the tenants table + config volume with valid Hive usernames and use
 * the account/community verification as an RPC amplifier. This caps requests per IP over a
 * sliding-ish fixed window (INCR + first-hit EXPIRE, atomic via a tiny Lua script).
 *
 * Fails OPEN: a Redis outage must not take signup/login down. The x402 payment paths keep
 * their own fail-CLOSED reservation (payment-target-lock), which is the correct trade-off
 * there; a browsing/creation limit erring toward availability is the right one here.
 */

import type { Context, Next } from 'hono';
import { getRedisClient } from '../utils/redis';

// INCR the counter and set the window TTL only on the first hit, atomically. Returns the
// current count so the caller can compare against the limit.
const RATE_LIMIT_SCRIPT = `
  local current = redis.call("incr", KEYS[1])
  if current == 1 then
    redis.call("pexpire", KEYS[1], ARGV[1])
  end
  return current
`;

export interface RateLimitOptions {
  /** Distinct bucket name so different route groups don't share a budget. */
  name: string;
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/** The client IP, taken from the trusted proxy header set by the fronting nginx/Traefik. */
function clientIp(c: Context): string {
  const xff = c.req.header('x-forwarded-for');
  if (xff) {
    // First entry is the original client; the rest are proxies.
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return c.req.header('x-real-ip')?.trim() || 'unknown';
}

export function rateLimit(options: RateLimitOptions) {
  const { name, limit, windowMs } = options;

  return async function rateLimitMiddleware(c: Context, next: Next) {
    const ip = clientIp(c);
    const key = `rl:${name}:${ip}`;

    let count: number;
    try {
      const client = await getRedisClient();
      count = (await client.eval(RATE_LIMIT_SCRIPT, {
        keys: [key],
        arguments: [String(windowMs)],
      })) as number;
    } catch (error) {
      // Fail open: never block a legitimate request because Redis is unavailable.
      console.error('[RateLimit] Redis unavailable, allowing request:', (error as Error).message);
      return next();
    }

    if (count > limit) {
      c.header('Retry-After', String(Math.ceil(windowMs / 1000)));
      return c.json({ error: 'Too many requests. Please slow down and try again.' }, 429);
    }

    await next();
  };
}
