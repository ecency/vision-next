/**
 * x402 Paywall Middleware Configuration
 *
 * Pre-configured paywall instances for subscription and upgrade flows.
 */

import { honoPaywall } from '@hiveio/x402/middleware/hono';
import { PAYMENT_ACCOUNT, MONTHLY_PRICE_HBD, PRO_UPGRADE_PRICE_HBD, hbd } from '../pricing';

const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'http://localhost:4020';

/**
 * Paywall for new subscriptions (1 HBD default)
 */
export const subscriptionPaywall = honoPaywall({
  amount: `${hbd(MONTHLY_PRICE_HBD)} HBD`,
  receivingAccount: PAYMENT_ACCOUNT,
  facilitatorUrl: FACILITATOR_URL,
  description: 'Ecency Blog hosting - 1 month subscription',
});

/**
 * Paywall for Pro plan upgrade (3 HBD default)
 */
export const proUpgradePaywall = honoPaywall({
  amount: `${hbd(PRO_UPGRADE_PRICE_HBD)} HBD`,
  receivingAccount: PAYMENT_ACCOUNT,
  facilitatorUrl: FACILITATOR_URL,
  description: 'Ecency Blog hosting - Pro plan upgrade',
});
