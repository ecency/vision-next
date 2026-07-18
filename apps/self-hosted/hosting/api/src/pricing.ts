/**
 * Single source of truth for hosting payment amounts and the payment account.
 *
 * Every route that QUOTES a price to a user (payments/instructions, tenants create, the x402
 * paywalls, payments/methods) and the payment-listener that VALIDATES the paid transfer must agree
 * on the same numbers. When they diverged (some files defaulted MONTHLY_PRICE_HBD to 0.100, others
 * to 2.000) a user could follow a quoted amount and be credited a different number of months, or
 * have a correct payment rejected. Keeping the defaults here — read once — makes that impossible.
 *
 * Defaults match production env.
 */

export const PAYMENT_ACCOUNT = process.env.PAYMENT_ACCOUNT || 'ecency.hosting';

export const MONTHLY_PRICE_HBD = parseFloat(process.env.MONTHLY_PRICE_HBD || '2.000');

export const PRO_UPGRADE_PRICE_HBD = parseFloat(process.env.PRO_UPGRADE_PRICE_HBD || '0.500');

// Custom-domain ('pro') tier: standard + 1 HBD/mo unless explicitly overridden.
export const CUSTOM_DOMAIN_MONTHLY_PRICE_HBD = parseFloat(
  process.env.CUSTOM_DOMAIN_MONTHLY_PRICE_HBD || (MONTHLY_PRICE_HBD + 1).toString()
);

// HBD amounts are conventionally quoted to 3 decimals (e.g. "2.000 HBD").
export const hbd = (n: number): string => n.toFixed(3);
