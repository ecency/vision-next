/**
 * Payment Routes
 */

import { Hono } from 'hono';
import { db } from '../db/client';
import { authMiddleware } from '../middleware/auth';

export const paymentRoutes = new Hono();

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
  const monthlyPrice = parseFloat(process.env.MONTHLY_PRICE_HBD || '1.000');
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
paymentRoutes.get('/stats', async (c) => {
  // TODO: Add admin authentication

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
