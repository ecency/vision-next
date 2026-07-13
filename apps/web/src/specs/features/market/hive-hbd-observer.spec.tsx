import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HiveHbdObserver } from "@/app/market/advanced/_advanced-mode/pairs/hive-hbd-observer";

// The observer wires four React Query refetches to a poll interval, a mount
// hook, and a post-trade `refresh` flag. These specs pin down the two
// regressions behind the chronic AbortError family on /market/advanced
// (ECENCY-NEXT-1GHQ): refetches must JOIN an in-flight request instead of
// aborting it (cancelRefetch: false), and the refresh effect must fire only on
// refresh=true — not on every parent re-render that changes a callback
// identity.

const useQueryMock = vi.fn();
const useInfiniteQueryMock = vi.fn();

vi.mock("@tanstack/react-query", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@tanstack/react-query")),
  useQuery: (...args: unknown[]) => useQueryMock(...args),
  useInfiniteQuery: (...args: unknown[]) => useInfiniteQueryMock(...args)
}));

vi.mock("@ecency/sdk", () => ({
  getHiveHbdStatsQueryOptions: vi.fn(() => ({ queryKey: ["hive-hbd-stats"] })),
  getOpenOrdersQueryOptions: vi.fn(() => ({ queryKey: ["open-orders"] })),
  getOrderBookQueryOptions: vi.fn(() => ({ queryKey: ["order-book"] })),
  getTransactionsInfiniteQueryOptions: vi.fn(() => ({ queryKey: ["transactions"] }))
}));

vi.mock("@/core/hooks", () => ({
  useActiveAccount: () => ({ username: "alice" })
}));

const getCGMarketMock = vi.fn(async () => [0.35, 1]);
vi.mock("@/api/coingecko-api", () => ({
  getCGMarket: (...args: unknown[]) => getCGMarketMock(...args)
}));

const queryRefetch = vi.fn();
const infiniteRefetch = vi.fn();

function makeProps(overrides: Partial<React.ComponentProps<typeof HiveHbdObserver>> = {}) {
  return {
    onDayChange: vi.fn(),
    onHistoryChange: vi.fn(),
    onUsdChange: vi.fn(),
    refresh: false,
    setRefresh: vi.fn(),
    setOpenOrders: vi.fn(),
    setAllOrders: vi.fn(),
    updateRate: 60_000,
    ...overrides
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("HiveHbdObserver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockReturnValue({ data: undefined, refetch: queryRefetch });
    useInfiniteQueryMock.mockReturnValue({ data: undefined, refetch: infiniteRefetch });
    getCGMarketMock.mockResolvedValue([0.35, 1]);
  });

  it("fires ONE round on mount, joining in-flight requests (cancelRefetch: false)", async () => {
    render(<HiveHbdObserver {...makeProps()} />);
    await flush();

    // stats + order book + open orders via useQuery, transactions via
    // useInfiniteQuery — each exactly once, each with cancelRefetch: false.
    expect(queryRefetch).toHaveBeenCalledTimes(3);
    expect(infiniteRefetch).toHaveBeenCalledTimes(1);
    for (const call of [...queryRefetch.mock.calls, ...infiniteRefetch.mock.calls]) {
      expect(call[0]).toEqual({ cancelRefetch: false });
    }
  });

  it("does NOT re-fire a round when a parent re-render changes a callback identity", async () => {
    const props = makeProps();
    const { rerender } = render(<HiveHbdObserver {...props} />);
    await flush();
    queryRefetch.mockClear();
    infiniteRefetch.mockClear();

    // A parent re-render minting a new onUsdChange gives fetchAllStats a new
    // identity; the refresh effect must stay gated and not refetch.
    rerender(<HiveHbdObserver {...props} onUsdChange={vi.fn()} />);
    await flush();

    expect(queryRefetch).not.toHaveBeenCalled();
    expect(infiniteRefetch).not.toHaveBeenCalled();
  });

  it("fires a FRESH round (cancelRefetch: true) and clears the flag when refresh becomes true", async () => {
    // Post-trade, an in-flight request may predate the trade — joining it
    // would show stale open orders, so this round must cancel and reissue.
    const props = makeProps();
    const { rerender } = render(<HiveHbdObserver {...props} />);
    await flush();
    queryRefetch.mockClear();
    infiniteRefetch.mockClear();

    rerender(<HiveHbdObserver {...props} refresh={true} />);
    await flush();

    expect(queryRefetch).toHaveBeenCalledTimes(3);
    expect(infiniteRefetch).toHaveBeenCalledTimes(1);
    for (const call of [...queryRefetch.mock.calls, ...infiniteRefetch.mock.calls]) {
      expect(call[0]).toEqual({ cancelRefetch: true });
    }
    expect(props.setRefresh).toHaveBeenCalledWith(false);
  });

  it("contains a CoinGecko failure instead of leaking an unhandled rejection", async () => {
    // Callers never await fetchAllStats, so before the try/catch this
    // rejection escaped as an unhandled rejection (vitest would fail the run).
    getCGMarketMock.mockRejectedValue(new Error("coingecko down"));
    const props = makeProps();
    render(<HiveHbdObserver {...props} />);
    await flush();

    expect(props.onUsdChange).not.toHaveBeenCalled();
  });
});
