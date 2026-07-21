import { describe, expect, it } from "vitest";
import { calculateEngineTokensUsdValue } from "@/app/decks/_components/columns/helpers/engine-tokens-usd-value";

const PRICE_PER_HIVE = 0.25;

describe("decks balance column – engine tokens usd value", () => {
  it("prices a token from its market metrics", () => {
    const total = calculateEngineTokensUsdValue(
      [{ symbol: "LEO", balance: "100" }],
      [{ symbol: "LEO", lastPrice: "0.02" }],
      PRICE_PER_HIVE
    );

    expect(total).toBeCloseTo(0.5, 10);
  });

  it("prices SWAP.HIVE directly off the hive price", () => {
    const total = calculateEngineTokensUsdValue(
      [{ symbol: "SWAP.HIVE", balance: "40" }],
      [],
      PRICE_PER_HIVE
    );

    expect(total).toBeCloseTo(10, 10);
  });

  it("skips a held token that has no market metrics entry instead of returning NaN", () => {
    // The column used to render "$NaN" for every wallet holding a never-traded token.
    const total = calculateEngineTokensUsdValue(
      [
        { symbol: "SWAP.HIVE", balance: "40" },
        { symbol: "NOMARKET", balance: "1000" }
      ],
      [{ symbol: "LEO", lastPrice: "0.02" }],
      PRICE_PER_HIVE
    );

    expect(Number.isNaN(total)).toBe(false);
    expect(total).toBeCloseTo(10, 10);
  });

  it("ignores unparsable balances and a non-finite hive price", () => {
    expect(
      calculateEngineTokensUsdValue(
        [{ symbol: "LEO", balance: "not-a-number" }],
        [{ symbol: "LEO", lastPrice: "0.02" }],
        PRICE_PER_HIVE
      )
    ).toBe(0);

    expect(
      calculateEngineTokensUsdValue(
        [{ symbol: "SWAP.HIVE", balance: "40" }],
        [],
        Number.POSITIVE_INFINITY
      )
    ).toBe(0);
  });

  it("returns zero for an empty wallet", () => {
    expect(calculateEngineTokensUsdValue([], [], PRICE_PER_HIVE)).toBe(0);
  });
});
