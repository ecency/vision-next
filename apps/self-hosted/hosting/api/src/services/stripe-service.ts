/**
 * Stripe (card) payments for hosting subscriptions.
 *
 * One-time "buy N months" that mirrors the HBD flow: a Checkout Session is created
 * for an existing (inactive) tenant, and on `checkout.session.completed` the webhook
 * activates/extends the subscription via the SAME `TenantService.activateSubscription`
 * the HBD listener uses. Idempotent via the unique `payments.trx_id` (the session id),
 * exactly like the on-chain path.
 */

import Stripe from 'stripe';
import { db } from '../db/client';
import { TenantService } from './tenant-service';
import { AuditService } from './audit-service';

const SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
// Price per month in USD cents (mirrors MONTHLY_PRICE_HBD; default $2.00).
const PRICE_USD_CENTS = parseInt(process.env.STRIPE_MONTHLY_PRICE_USD_CENTS || '200', 10);
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'blogs.ecency.com';
// Where Stripe returns the buyer after checkout (the public signup page).
const RETURN_URL = process.env.HOSTING_SIGNUP_URL || 'https://ecency.com/hosting';

let _stripe: Stripe | null = null;
function client(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(SECRET_KEY);
  }
  return _stripe;
}

export const StripeService = {
  /** Card payment is offered only when a secret key is configured. */
  enabled(): boolean {
    return SECRET_KEY.trim().length > 0;
  },

  priceUsdCents(): number {
    return PRICE_USD_CENTS;
  },

  /**
   * Create a one-time Checkout Session for `months` of hosting for `username`
   * (which must already exist as a tenant). Returns the hosted checkout URL.
   */
  async createCheckoutSession(username: string, months: number): Promise<{ url: string; id: string }> {
    const amount = PRICE_USD_CENTS * months;
    const session = await client().checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: `Ecency blog hosting — @${username}`,
              description: `${months} month${months > 1 ? 's' : ''} of hosting for ${username}.${BASE_DOMAIN}`,
            },
          },
        },
      ],
      // Consumed by the webhook to activate the right tenant for the right term.
      metadata: { username, months: String(months) },
      success_url: `${RETURN_URL}?paid=1&u=${encodeURIComponent(username)}`,
      cancel_url: `${RETURN_URL}?canceled=1&u=${encodeURIComponent(username)}`,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL');
    }
    return { url: session.url, id: session.id };
  },

  /**
   * Verify + process a Stripe webhook. On a paid `checkout.session.completed`,
   * record the payment (deduped by session id) and extend the subscription.
   * Returns a short status for logging; never throws on a benign duplicate.
   */
  async handleWebhook(rawBody: string, signature: string): Promise<{ handled: boolean; duplicate?: boolean }> {
    const event = client().webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);

    if (event.type !== 'checkout.session.completed') {
      return { handled: false };
    }

    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== 'paid') {
      return { handled: false };
    }

    const username = session.metadata?.username;
    const months = parseInt(session.metadata?.months || '0', 10);
    if (!username || months < 1) {
      return { handled: false };
    }

    const tenant = await TenantService.getByUsername(username);
    if (!tenant) {
      return { handled: false };
    }

    const amountUsd = (session.amount_total ?? 0) / 100;

    // Insert first with a unique trx_id (the session id) so a re-delivered webhook
    // can't double-credit — same dedup contract as the on-chain listener.
    const inserted = await db.queryOne<{ id: string }>(
      `INSERT INTO payments
         (tenant_id, trx_id, block_num, from_account, amount, currency, memo, status, months_credited)
       VALUES ($1, $2, 0, 'stripe', $3, 'USD', $4, 'processing', $5)
       ON CONFLICT (trx_id) DO NOTHING
       RETURNING id`,
      [tenant.id, session.id, amountUsd, `blog:${username}:${months}`, months]
    );

    if (!inserted) {
      // Already processed (webhook re-delivery) — nothing more to do.
      return { handled: true, duplicate: true };
    }

    const updated = await TenantService.activateSubscription(username, months);

    await db.query(
      `UPDATE payments
         SET status = 'processed', processed_at = NOW(), subscription_extended_to = $2
       WHERE trx_id = $1`,
      [session.id, updated.subscriptionExpiresAt]
    );

    void AuditService.log({
      tenantId: tenant.id,
      eventType: 'payment.stripe',
      eventData: { session: session.id, months, amountUsd },
    });

    return { handled: true };
  },
};

export default StripeService;
