import {
  DEFAULT_STRIPE_TIER_SKU,
  STRIPE_POINTS_TIERS
} from "@/features/shared/purchase-stripe/stripe-config";
import { describe, expect, it } from "vitest";

describe("stripe-config", () => {
  it("offers exactly the four card tiers (smallest IAP tiers excluded)", () => {
    expect(STRIPE_POINTS_TIERS.map((t) => t.sku)).toEqual([
      "499points",
      "999points",
      "4999points",
      "9999points"
    ]);
  });

  it("mirrors the ePoints STRIPE_PRODUCT_MAP price + points per tier", () => {
    // Must match ePoints constants.py STRIPE_PRODUCT_MAP (server is the source of truth).
    expect(STRIPE_POINTS_TIERS).toEqual([
      { sku: "499points", usd: 4.99, points: 2800 },
      { sku: "999points", usd: 9.99, points: 6000 },
      { sku: "4999points", usd: 49.99, points: 31500 },
      { sku: "9999points", usd: 99.99, points: 70000 }
    ]);
  });

  it("derives the USD price from the SKU number (cents)", () => {
    STRIPE_POINTS_TIERS.forEach((t) => {
      const cents = parseInt(t.sku, 10);
      expect(Math.round(t.usd * 100)).toBe(cents);
    });
  });

  it("uses a default tier that exists in the catalog", () => {
    expect(STRIPE_POINTS_TIERS.some((t) => t.sku === DEFAULT_STRIPE_TIER_SKU)).toBe(true);
  });
});
