import { hostingSkuForMonths } from "@/features/hosting-signup/hosting-api";
import { describe, expect, it } from "vitest";

describe("hostingSkuForMonths", () => {
  it("maps each term to its priced SKU (leading number = price in cents)", () => {
    expect(hostingSkuForMonths(1)).toBe("200hosting");
    expect(hostingSkuForMonths(3)).toBe("600hosting");
    expect(hostingSkuForMonths(6)).toBe("1200hosting");
    expect(hostingSkuForMonths(12)).toBe("2400hosting");
  });

  it("falls back to the 1-month SKU for an unknown term", () => {
    expect(hostingSkuForMonths(2)).toBe("200hosting");
    expect(hostingSkuForMonths(0)).toBe("200hosting");
  });
});
