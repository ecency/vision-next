import { PointsTopupCta, suggestPointsSkuForDeficit } from "@/features/shared/points-topup-cta";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/shared/purchase-stripe/stripe-config", async () => ({
  ...(await vi.importActual("@/features/shared/purchase-stripe/stripe-config")),
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

describe("PointsTopupCta", () => {
  it("deep-links into card checkout with the tier covering the deficit", () => {
    render(<PointsTopupCta required={500} available={100} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/perks/points?buy=card&sku=499points");
    expect(link).not.toHaveAttribute("target");
  });

  it("falls back to the default tier when the deficit is unknown", () => {
    render(<PointsTopupCta />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/perks/points?buy=card&sku=999points"
    );
  });

  it("opens in a new tab when requested", () => {
    render(<PointsTopupCta required={500} available={0} newTab={true} />);
    expect(screen.getByRole("link")).toHaveAttribute("target", "_blank");
  });
});
