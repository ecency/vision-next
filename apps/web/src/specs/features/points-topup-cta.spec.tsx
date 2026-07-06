import { PointsTopupCta } from "@/features/shared/points-topup-cta";
import {
  isKnownTierSku,
  suggestPointsSkuForDeficit
} from "@/features/shared/purchase-stripe/stripe-tiers";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/shared/purchase-stripe/stripe-tiers", async () => ({
  ...(await vi.importActual("@/features/shared/purchase-stripe/stripe-tiers")),
  isStripeEnabled: () => true
}));

describe("suggestPointsSkuForDeficit", () => {
  it("returns undefined when there is no deficit", () => {
    expect(suggestPointsSkuForDeficit(0)).toBeUndefined();
    expect(suggestPointsSkuForDeficit(-150)).toBeUndefined();
    expect(suggestPointsSkuForDeficit(NaN)).toBeUndefined();
  });

  it("picks the smallest tier covering the deficit", () => {
    expect(suggestPointsSkuForDeficit(100)).toBe("499points");
    expect(suggestPointsSkuForDeficit(2800)).toBe("499points");
    expect(suggestPointsSkuForDeficit(2801)).toBe("999points");
    expect(suggestPointsSkuForDeficit(31500)).toBe("4999points");
  });

  it("falls back to the largest tier for oversized deficits", () => {
    expect(suggestPointsSkuForDeficit(1_000_000)).toBe("9999points");
  });
});

describe("isKnownTierSku", () => {
  it("accepts known card-rail tiers and rejects others", () => {
    expect(isKnownTierSku("999points")).toBe(true);
    expect(isKnownTierSku("099points")).toBe(false);
    expect(isKnownTierSku("garbage")).toBe(false);
    expect(isKnownTierSku("")).toBe(false);
  });
});

describe("PointsTopupCta", () => {
  it("deep-links into card checkout with the tier covering the deficit, in a new tab", () => {
    render(<PointsTopupCta required={500} available={100} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/perks/points?buy=card&sku=499points");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("falls back to the default tier when the deficit is unknown", () => {
    render(<PointsTopupCta />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/perks/points?buy=card&sku=999points"
    );
  });
});
