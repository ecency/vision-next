/**
 * Payment Routes
 */

import { Hono } from 'hono';
import { db } from '../db/client';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { StripeService } from '../services/stripe-service';
import { TenantService } from '../services/tenant-service';

export const paymentRoutes = new Hono();

// GET /v1/payments/methods - which rails are available + pricing (for the signup UI)
paymentRoutes.get('/methods', async (c) => {
  const monthlyHbd = process.env.MONTHLY_PRICE_HBD || '0.100';
  const facilitator = process.env.X402_FACILITATOR_URL || '';
  return c.json({
    hbd: {
      enabled: true,
      monthly: monthlyHbd,
      account: process.env.PAYMENT_ACCOUNT || 'ecency.hosting',
    },
    x402: {
      enabled: facilitator.startsWith('https://'),
      monthly: monthlyHbd,
    },
    card: {
      enabled: StripeService.enabled(),
      monthlyUsdCents: StripeService.priceUsdCents(),
    },
  });
});

// POST /v1/payments/stripe/checkout - create a one-time card checkout for N months
paymentRoutes.post('/stripe/checkout', async (c) => {
  if (!StripeService.enabled()) {
    return c.json({ error: 'card_unavailable', message: 'Card payment is not available' }, 503);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_body' }, 400);
  }

  const username = String(body?.username || '').toLowerCase();
  const months = Math.max(1, Math.min(24, parseInt(body?.months, 10) || 1));

  if (!/^[a-z][a-z0-9.-]{2,15}$/.test(username)) {
    return c.json({ error: 'invalid_username' }, 400);
  }

  // The tenant must already exist (created in the previous signup step); we only
  // charge for an existing blog so a stray payment can't be orphaned.
  const tenant = await TenantService.getByUsername(username);
  if (!tenant) {
    return c.json({ error: 'tenant_not_found', message: 'Create your blog first' }, 404);
  }

  try {
    const { url } = await StripeService.createCheckoutSession(username, months);
    return c.json({ url });
  } catch (e) {
    console.error('[stripe] checkout failed:', (e as Error).message);
    return c.json({ error: 'checkout_failed' }, 500);
  }
});

// POST /v1/payments/stripe/webhook - Stripe -> activate/extend subscription
paymentRoutes.post('/stripe/webhook', async (c) => {
  const sig = c.req.header('stripe-signature');
  if (!sig) {
    return c.json({ error: 'missing_signature' }, 400);
  }
  // Raw body is required for signature verification.
  const raw = await c.req.text();
  try {
    const res = await StripeService.handleWebhook(raw, sig);
    return c.json({ received: true, ...res });
  } catch (e) {
    console.error('[stripe] webhook error:', (e as Error).message);
    return c.json({ error: 'webhook_error' }, 400);
  }
});

// GET /v1/payments - Get payment history for authenticated user
paymentRoutes.get('/', authMiddleware, async (c) => {
  const authUser = c.get('user');
  const username = authUser.username;

  const tenant = await db.queryOne<{ id: string }>(
    'SELECT id FROM tenants WHERE username = $1',
    [username]
  );

  if (!tenant) {
    return c.json({ payments: [] });
  }

  const payments = await db.queryAll(
    `SELECT
       id, trx_id, block_num, from_account, amount, currency,
       memo, status, months_credited, subscription_extended_to, created_at
     FROM payments
     WHERE tenant_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [tenant.id]
  );

  return c.json({ payments });
});

// GET /v1/payments/instructions/:username - Get payment instructions
paymentRoutes.get('/instructions/:username', async (c) => {
  const username = c.req.param('username');
  const months = parseInt(c.req.query('months') || '1', 10);

  const paymentAccount = process.env.PAYMENT_ACCOUNT || 'ecency.hosting';
  const monthlyPrice = parseFloat(process.env.MONTHLY_PRICE_HBD || '0.100');
  const totalAmount = (monthlyPrice * months).toFixed(3);

  return c.json({
    to: paymentAccount,
    amount: totalAmount + ' HBD',
    memo: months > 1 ? `blog:${username}:${months}` : `blog:${username}`,
    monthlyPrice: monthlyPrice + ' HBD',
    months,
    totalAmount: totalAmount + ' HBD',
    instructions: [
      `Send ${totalAmount} HBD to @${paymentAccount}`,
      `Use memo: blog:${username}${months > 1 ? ':' + months : ''}`,
      'Your blog will be activated within seconds of payment confirmation',
    ],
  });
});

// GET /v1/payments/verify/:trxId - Check if a specific transaction was processed
paymentRoutes.get('/verify/:trxId', async (c) => {
  const trxId = c.req.param('trxId');

  const payment = await db.queryOne(
    `SELECT
       id, trx_id, status, months_credited, subscription_extended_to, created_at
     FROM payments
     WHERE trx_id = $1`,
    [trxId]
  );

  if (!payment) {
    return c.json({
      found: false,
      message: 'Transaction not found. It may take a few seconds to process.',
    });
  }

  return c.json({
    found: true,
    status: payment.status,
    monthsCredited: payment.months_credited,
    subscriptionExtendedTo: payment.subscription_extended_to,
  });
});

// GET /v1/payments/stats - Admin stats (requires admin auth)
paymentRoutes.get('/stats', authMiddleware, adminMiddleware, async (c) => {
  const stats = await db.queryOne(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'processed') as total_payments,
      SUM(amount) FILTER (WHERE status = 'processed') as total_hbd,
      SUM(months_credited) FILTER (WHERE status = 'processed') as total_months,
      COUNT(DISTINCT tenant_id) FILTER (WHERE status = 'processed') as unique_tenants,
      COUNT(*) FILTER (WHERE status = 'processed' AND created_at > NOW() - INTERVAL '30 days') as payments_30d,
      SUM(amount) FILTER (WHERE status = 'processed' AND created_at > NOW() - INTERVAL '30 days') as hbd_30d
    FROM payments
  `);

  const activeSubscriptions = await db.queryOne(`
    SELECT COUNT(*) as count FROM tenants WHERE subscription_status = 'active'
  `);

  return c.json({
    totalPayments: parseInt(stats.total_payments || '0'),
    totalHbd: parseFloat(stats.total_hbd || '0'),
    totalMonthsCredited: parseInt(stats.total_months || '0'),
    uniqueTenants: parseInt(stats.unique_tenants || '0'),
    last30Days: {
      payments: parseInt(stats.payments_30d || '0'),
      hbd: parseFloat(stats.hbd_30d || '0'),
    },
    activeSubscriptions: parseInt(activeSubscriptions?.count || '0'),
  });
});

export default paymentRoutes;
