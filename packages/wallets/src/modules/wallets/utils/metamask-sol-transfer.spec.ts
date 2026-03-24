import { describe, it, expect } from "vitest";
import { parseToLamports, formatLamports, getSolExplorerUrl } from "./metamask-sol-transfer";

describe("parseToLamports", () => {
  it("converts 1 SOL to lamports", () => {
    expect(parseToLamports("1")).toBe(1_000_000_000);
  });

  it("converts fractional SOL", () => {
    expect(parseToLamports("0.5")).toBe(500_000_000);
  });

  it("converts small amounts", () => {
    expect(parseToLamports("0.000000001")).toBe(1);
  });

  it("handles zero", () => {
    expect(parseToLamports("0")).toBe(0);
  });

  it("handles large amounts without precision loss", () => {
    // 9007 SOL — close to Number.MAX_SAFE_INTEGER threshold
    expect(parseToLamports("9007")).toBe(9_007_000_000_000);
  });

  it("truncates beyond 9 decimals", () => {
    expect(parseToLamports("1.0000000019")).toBe(1_000_000_001);
  });
});

describe("formatLamports", () => {
  it("formats 1 SOL", () => {
    expect(formatLamports(1_000_000_000)).toBe("1");
  });

  it("formats 0.5 SOL", () => {
    expect(formatLamports(500_000_000)).toBe("0.5");
  });

  it("formats zero", () => {
    expect(formatLamports(0)).toBe("0");
  });

  it("trims trailing zeros", () => {
    expect(formatLamports(1_500_000_000)).toBe("1.5");
  });

  it("formats with custom precision", () => {
    expect(formatLamports(123_456_789, 4)).toBe("0.1234");
  });
});

describe("getSolExplorerUrl", () => {
  it("constructs correct explorer URL", () => {
    expect(getSolExplorerUrl("abc123")).toBe("https://explorer.solana.com/tx/abc123");
  });
});
