import {
  HOSTING_CUSTOM_DOMAIN_MONTHLY_USD,
  HOSTING_MONTHLY_USD,
  hostingProSkuForMonths,
  hostingSkuForMonths
} from "@/features/hosting-signup/hosting-api";
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

describe("hostingProSkuForMonths", () => {
  it("maps each term to the $3/mo Custom domain SKU (leading number = price in cents)", () => {
    expect(hostingProSkuForMonths(1)).toBe("300prohosting");
    expect(hostingProSkuForMonths(3)).toBe("900prohosting");
    expect(hostingProSkuForMonths(6)).toBe("1800prohosting");
    expect(hostingProSkuForMonths(12)).toBe("3600prohosting");
  });

  it("falls back to the 1-month Custom domain SKU for an unknown term", () => {
    expect(hostingProSkuForMonths(2)).toBe("300prohosting");
    expect(hostingProSkuForMonths(0)).toBe("300prohosting");
  });

  it("prices the Custom domain add-on at +$1/mo over standard hosting", () => {
    expect(HOSTING_MONTHLY_USD).toBe(2);
    expect(HOSTING_CUSTOM_DOMAIN_MONTHLY_USD).toBe(3);
    expect(HOSTING_CUSTOM_DOMAIN_MONTHLY_USD - HOSTING_MONTHLY_USD).toBe(1);
  });
});
