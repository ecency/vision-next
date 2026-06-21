import { loadStripe, Stripe } from "@stripe/stripe-js";

// The publishable key is public (safe in the browser) but environment-specific
// (test vs live). It is baked at build time as a NEXT_PUBLIC_ var. When it is not
// configured, card payment is disabled (the entry point hides itself) so we never
// render a broken Payment Element.
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export const isStripeEnabled = (): boolean => PUBLISHABLE_KEY.trim().length > 0;

let stripePromise: Promise<Stripe | null> | undefined;

/**
 * Memoised Stripe.js loader (loadStripe must run once per page). Returns undefined
 * when the publishable key is not configured so callers can fall back gracefully.
 */
export const getStripePromise = (): Promise<Stripe | null> | undefined => {
  if (!isStripeEnabled()) {
    return undefined;
  }
  if (!stripePromise) {
    stripePromise = loadStripe(PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export interface StripePointsTier {
  /** SKU forwarded to ePoints; the amount + Points are derived there server-side. */
  sku: string;
  /** USD price (the SKU's leading number IS the price in cents). */
  usd: number;
  /** Points delivered. MUST mirror ePoints STRIPE_PRODUCT_MAP (server is the truth). */
  points: number;
}

// Mirrors ePoints constants.py STRIPE_PRODUCT_MAP. The smallest IAP tiers (099/199)
// are intentionally not offered on the card rail. The Points figures are display-only;
// the actual credit is computed server-side from the SKU, so a drift here only affects
// the label, never the delivered amount.
export const STRIPE_POINTS_TIERS: StripePointsTier[] = [
  { sku: "499points", usd: 4.99, points: 2800 },
  { sku: "999points", usd: 9.99, points: 6000 },
  { sku: "4999points", usd: 49.99, points: 31500 },
  { sku: "9999points", usd: 99.99, points: 70000 }
];

export const DEFAULT_STRIPE_TIER_SKU = "999points";
