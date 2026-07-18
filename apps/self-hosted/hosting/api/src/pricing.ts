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

// Whole months remaining on a subscription, rounding a partial month UP (so an active tenant with
// any remaining term pays for at least one month of the add-on). Returns 0 for a null/past expiry.
//
// Counts by repeatedly adding one calendar month — the SAME setMonth() arithmetic the activation
// paths use to build the expiry — rather than a raw month-index difference. That matters for JS
// end-of-month rollover: a 1-month term bought on Jan 31 becomes March 3 (Feb has no 31st), and a
// month-index diff would miscount that as 2 months and double-charge the upgrade. Stepping with
// setMonth reproduces the rollover, so Jan 31 -> March 3 is one month.
//
// Both the quote and the listener use this at their own "now"; since time only moves forward,
// remaining only shrinks, so a payment made against an earlier (equal-or-higher) quote is never
// later rejected as insufficient.
export function remainingMonths(expiresAt: Date | null, now: Date): number {
  if (!expiresAt || expiresAt.getTime() <= now.getTime()) return 0;
  // Count how many whole calendar months fit before expiry: step `now` forward a month at a time
  // while the step stays at/before expiry.
  let months = 0;
  const step = new Date(now.getTime());
  step.setMonth(step.getMonth() + 1);
  while (step.getTime() <= expiresAt.getTime() && months < 600) {
    months += 1;
    step.setMonth(step.getMonth() + 1);
  }
  // If those whole months don't reach expiry exactly, a partial month remains and rounds up.
  const atMonths = new Date(now.getTime());
  atMonths.setMonth(atMonths.getMonth() + months);
  if (atMonths.getTime() < expiresAt.getTime()) months += 1;
  return Math.max(1, months);
}

// Prorated HBD cost to add a custom domain to an active tenant for the rest of its current term.
export function customDomainUpgradeHbd(expiresAt: Date | null, now: Date): number {
  return remainingMonths(expiresAt, now) * CUSTOM_DOMAIN_UPGRADE_DELTA_HBD;
}

// HBD amounts are conventionally quoted to 3 decimals (e.g. "2.000 HBD").
export const hbd = (n: number): string => n.toFixed(3);
