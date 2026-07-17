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
import { parseClientIp } from '../services/audit-service';

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

/**
 * The client IP as the trusted fronting proxy saw it: the LAST X-Forwarded-For entry (nginx
 * appends the real peer with $proxy_add_x_forwarded_for), NOT the leftmost value, which is
 * client-supplied and could be rotated per request to mint a fresh bucket and bypass the
 * limit. Returns null when no proxy header is present.
 */
function trustedClientIp(c: Context): string | null {
  return (
    parseClientIp(c.req.header('x-forwarded-for')) || c.req.header('x-real-ip')?.trim() || null
  );
}

export function rateLimit(options: RateLimitOptions) {
  const { name, limit, windowMs } = options;

  return async function rateLimitMiddleware(c: Context, next: Next) {
    const ip = trustedClientIp(c);
    // No trusted proxy IP (request didn't traverse the fronting proxy). Do NOT bucket these
    // together under a shared key — one client could exhaust it and 429 unrelated clients.
    // Behind the real deployment every request carries the header; skip limiting otherwise.
    if (!ip) {
      return next();
    }
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
