/**
 * Internal (service-to-service) routes. NOT public — mounted at /v1/internal and every
 * handler is guarded by the shared HOSTING_INTERNAL_SECRET. Kept separate from the public
 * /v1/payments routes so an internal endpoint can never inherit public middleware or be
 * confused with a customer-facing path.
 */

import { Hono } from 'hono';
import { db } from '../db/client';

export const internalRoutes = new Hono();

// Constant-time check of the shared service-to-service secret (ePoints -> hosting).
// Fails CLOSED when the secret is unset, so a misconfigured deploy cannot activate blogs.
export function internalSecretOk(provided: string | undefined): boolean {
  const secret = process.env.HOSTING_INTERNAL_SECRET || '';
  const given = provided || '';
  if (secret.length === 0 || given.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= given.charCodeAt(i) ^ secret.charCodeAt(i);
  return diff === 0;
}

// POST /v1/internal/activate - service-to-service activation (NOT public).
// Called by ePoints' fulfillment after a paid card order settles (ePoints is the single
// Stripe brain; hosting never sees card data or Stripe keys). Guarded by a shared secret.
// Idempotent + atomic: dedup on the order id so a fulfillment retry can never double-extend,
// and the payment record + activation commit together so a crash can't leave a paid tenant
// uncredited. Returns 200 on success or benign replay; 404 (permanent) if the tenant is gone
// so ePoints FAILs the order; 5xx (transient) so ePoints leaves it VERIFIED and retries.
internalRoutes.post('/activate', async (c) => {
  if (!internalSecretOk(c.req.header('x-internal-secret'))) {
    return c.json({ error: 'forbidden' }, 403);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_body' }, 400);
  }

  const username = String(body?.username || '').toLowerCase();
  // Strict: reject a missing/garbage/out-of-range term rather than silently granting 1 month.
  const monthsRaw = parseInt(body?.months, 10);
  const months = Number.isInteger(monthsRaw) ? monthsRaw : 0;
  const orderId = String(body?.order_id || '').trim();
  const amountUsd = typeof body?.amount_usd === 'number' ? body.amount_usd : 0;
  // Optional tier: 'pro' upgrades the tenant to the Pro plan (custom domains). Anything else
  // leaves the current plan untouched, so a standard renewal never downgrades a Pro tenant.
  const plan = body?.plan === 'pro' ? 'pro' : 'standard';

  if (!/^[a-z][a-z0-9.-]{2,15}$/.test(username) || months < 1 || months > 24 || !orderId) {
    return c.json({ error: 'invalid_request' }, 400);
  }

  try {
    const result = await db.transaction<{ status: 200 | 404 | 409; duplicate?: boolean; expiresAt?: Date; plan?: string }>(
      async (client) => {
        // Lock the tenant row (serializes retries) and confirm it still exists.
        const t = await client.query(
          `SELECT id, subscription_started_at, subscription_expires_at, subscription_plan
             FROM tenants WHERE username = $1 FOR UPDATE`,
          [username]
        );
        if (t.rowCount === 0) {
          return { status: 404 };
        }
        const tenant = t.rows[0];

        // Idempotent Pro upgrade for THIS tenant (a standard activation never touches the plan, so
        // it can never downgrade a Pro tenant). Only ever invoked for an order this tenant owns --
        // gated by the claim / ownership checks below, so a colliding order id can't grant Pro.
        const applyPlan = async (): Promise<string> => {
          if (plan === 'pro' && tenant.subscription_plan !== 'pro') {
            await client.query(
              `UPDATE tenants SET subscription_plan = 'pro', updated_at = NOW() WHERE id = $1`,
              [tenant.id]
            );
            return 'pro';
          }
          return tenant.subscription_plan;
        };

        // Claim the order id.
        const claim = await client.query(
          `INSERT INTO payments
             (tenant_id, trx_id, block_num, from_account, amount, currency, memo, status, months_credited)
           VALUES ($1, $2, 0, 'stripe', $3, 'USD', $4, 'processed', $5)
           ON CONFLICT (trx_id) DO NOTHING
           RETURNING id`,
          [tenant.id, orderId, amountUsd, `blog:${username}:${months}`, months]
        );
        if (claim.rowCount === 0) {
          // Replay: the order id already exists. It must belong to THIS tenant; otherwise it is a
          // collision/misroute and we must not mutate this tenant for an order that isn't theirs.
          const owner = await client.query(
            `SELECT tenant_id FROM payments WHERE trx_id = $1`,
            [orderId]
          );
          if (owner.rows[0]?.tenant_id !== tenant.id) {
            return { status: 409 };
          }
          // Genuine replay of this tenant's order: re-apply the upgrade idempotently (self-heal
          // after a staggered deploy) without re-extending the term.
          return { status: 200, duplicate: true, plan: await applyPlan() };
        }

        const effectivePlan = await applyPlan();

        // Extend from the later of now / current expiry (same rule as activateSubscription).
        const now = new Date();
        const currentExpiry = tenant.subscription_expires_at
          ? new Date(tenant.subscription_expires_at)
          : now;
        const base = currentExpiry > now ? currentExpiry : now;
        const newExpiry = new Date(base);
        newExpiry.setMonth(newExpiry.getMonth() + months);
        const startedAt = tenant.subscription_started_at || now;

        await client.query(
          `UPDATE tenants
             SET subscription_status = 'active',
                 subscription_started_at = $2,
                 subscription_expires_at = $3,
                 updated_at = NOW()
           WHERE id = $1`,
          [tenant.id, startedAt, newExpiry]
        );
        await client.query(
          `UPDATE payments SET processed_at = NOW(), subscription_extended_to = $2 WHERE trx_id = $1`,
          [orderId, newExpiry]
        );
        return { status: 200, expiresAt: newExpiry, plan: effectivePlan };
      }
    );

    if (result.status === 404) {
      return c.json({ error: 'tenant_not_found' }, 404);
    }
    if (result.status === 409) {
      // The order id is already recorded against a DIFFERENT tenant -- a collision/misroute.
      // Surface it (the caller treats non-200/404 as retryable + alerts) rather than mutate.
      return c.json({ error: 'order_tenant_mismatch' }, 409);
    }
    // Echo the tenant's ACTUAL plan so the caller (ePoints) can confirm the Pro tier was honored.
    // Truthful on replays too (the upgrade is idempotent); an older service that ignores `plan`
    // omits this field, which the caller treats as a mismatch and retries.
    return c.json(
      { activated: true, duplicate: !!result.duplicate, expiresAt: result.expiresAt, plan: result.plan },
      200
    );
  } catch (e) {
    console.error('[internal/activate] error:', (e as Error).message);
    return c.json({ error: 'activation_failed' }, 500);
  }
});

export default internalRoutes;
