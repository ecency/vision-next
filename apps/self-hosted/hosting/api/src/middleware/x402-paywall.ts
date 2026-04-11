/**
 * x402 Paywall Middleware Configuration
 *
 * Pre-configured paywall instances for subscription and upgrade flows.
 */

import { honoPaywall } from '@hiveio/x402/middleware/hono';

const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'http://localhost:4020';
const PAYMENT_ACCOUNT = process.env.PAYMENT_ACCOUNT || 'ecency.hosting';
const MONTHLY_PRICE_HBD = process.env.MONTHLY_PRICE_HBD || '1.000';
const PRO_UPGRADE_PRICE_HBD = process.env.PRO_UPGRADE_PRICE_HBD || '3.000';

/**
 * Paywall for new subscriptions (1 HBD default)
 */
export const subscriptionPaywall = honoPaywall({
  amount: `${MONTHLY_PRICE_HBD} HBD`,
  receivingAccount: PAYMENT_ACCOUNT,
  facilitatorUrl: FACILITATOR_URL,
  description: 'Ecency Blog hosting - 1 month subscription',
});

/**
 * Paywall for Pro plan upgrade (3 HBD default)
 */
export const proUpgradePaywall = honoPaywall({
  amount: `${PRO_UPGRADE_PRICE_HBD} HBD`,
  receivingAccount: PAYMENT_ACCOUNT,
  facilitatorUrl: FACILITATOR_URL,
  description: 'Ecency Blog hosting - Pro plan upgrade',
});
