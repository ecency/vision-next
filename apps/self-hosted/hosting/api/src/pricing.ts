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

// The monthly premium of the custom-domain tier over standard hosting — i.e. the per-month cost of
// adding a custom domain to an already-paid standard blog. Used to PRORATE a mid-term upgrade so
// the owner pays exactly the difference for the months remaining on their current term.
export const CUSTOM_DOMAIN_UPGRADE_DELTA_HBD = Math.max(
  0,
  CUSTOM_DOMAIN_MONTHLY_PRICE_HBD - MONTHLY_PRICE_HBD
);

// Whole months remaining on a subscription, rounding a partial month UP (so an active tenant always
// pays for at least one month of the add-on). Both the upgrade quote and the listener validation
// use this, computed at their own "now" — since time only moves forward, remaining only shrinks, so
// a payment made against an earlier (higher) quote is never later rejected as insufficient.
export function remainingMonths(expiresAt: Date | null, now: Date): number {
  if (!expiresAt || expiresAt.getTime() <= now.getTime()) return 0;
  let months =
    (expiresAt.getFullYear() - now.getFullYear()) * 12 + (expiresAt.getMonth() - now.getMonth());
  if (expiresAt.getDate() > now.getDate()) months += 1;
  return Math.max(1, months);
}

// Prorated HBD cost to add a custom domain to an active tenant for the rest of its current term.
export function customDomainUpgradeHbd(expiresAt: Date | null, now: Date): number {
  return remainingMonths(expiresAt, now) * CUSTOM_DOMAIN_UPGRADE_DELTA_HBD;
}

// HBD amounts are conventionally quoted to 3 decimals (e.g. "2.000 HBD").
export const hbd = (n: number): string => n.toFixed(3);
