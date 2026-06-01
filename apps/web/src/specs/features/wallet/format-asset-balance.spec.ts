import { describe, it, expect } from "vitest";
import { formatAssetBalance } from "@/features/wallet/utils/format-asset-balance";

describe("formatAssetBalance", () => {
  // Pinned "en-US" => deterministic comma grouping + period decimal regardless of
  // the runtime locale, so SSR and client hydration produce identical text
  // (no React #418 -> removeChild crash).
  it("formats with a fixed en-US locale", () => {
    expect(formatAssetBalance(1234.5)).toBe("1,234.500");
    expect(formatAssetBalance(1_000_000)).toBe("1,000,000.000");
  });

  it("shows up to 8 fraction digits for sub-1 balances", () => {
    expect(formatAssetBalance(0.00001234)).toBe("0.00001234");
    expect(formatAssetBalance(0.5)).toBe("0.500");
  });

  it("returns '0' for non-finite input", () => {
    expect(formatAssetBalance(Number.NaN)).toBe("0");
    expect(formatAssetBalance(Number.POSITIVE_INFINITY)).toBe("0");
  });
});
