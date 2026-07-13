import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBottomPagination } from "@/core/hooks/use-bottom-pagination";

// The DetectBottom load-more callback has two failure modes this hook exists
// to prevent: aborting an in-flight fetch (fetchNextPage defaults to
// cancelRefetch: true) and dead-ending a query seeded with
// initialData: { pages: [] } (hasNextPage is false with zero pages and
// refetchOnMount is false app-wide, so the sentinel IS the page-1 bootstrap).

function makeQuery(overrides: Partial<Parameters<typeof useBottomPagination>[0]> = {}) {
  return {
    data: { pages: [["a"]] },
    hasNextPage: true,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(async () => undefined),
    ...overrides
  };
}

describe("useBottomPagination", () => {
  it("fetches the next page with cancelRefetch: false (joins, never aborts)", () => {
    const query = makeQuery();
    const { result } = renderHook(() => useBottomPagination(query));
    result.current();
    expect(query.fetchNextPage).toHaveBeenCalledTimes(1);
    expect(query.fetchNextPage).toHaveBeenCalledWith({ cancelRefetch: false });
  });

  it("bootstraps page 1 when no pages are loaded even though hasNextPage is false", () => {
    // The initialData: { pages: [] } case — hasNextPage is false with zero
    // pages, and gating on it alone leaves the list permanently empty.
    const query = makeQuery({ data: { pages: [] }, hasNextPage: false });
    const { result } = renderHook(() => useBottomPagination(query));
    result.current();
    expect(query.fetchNextPage).toHaveBeenCalledWith({ cancelRefetch: false });
  });

  it("bootstraps when data is undefined (query never seeded)", () => {
    const query = makeQuery({ data: undefined, hasNextPage: false });
    const { result } = renderHook(() => useBottomPagination(query));
    result.current();
    expect(query.fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("no-ops while a next-page fetch is in flight", () => {
    const query = makeQuery({ isFetchingNextPage: true });
    const { result } = renderHook(() => useBottomPagination(query));
    result.current();
    expect(query.fetchNextPage).not.toHaveBeenCalled();
  });

  it("no-ops at the end of results (pages loaded, no next page)", () => {
    const query = makeQuery({ hasNextPage: false });
    const { result } = renderHook(() => useBottomPagination(query));
    result.current();
    expect(query.fetchNextPage).not.toHaveBeenCalled();
  });

  it("keeps a stable identity across re-renders with unchanged inputs", () => {
    // DetectBottom re-runs its effect whenever onBottom's identity changes;
    // a stable callback avoids gratuitous re-fires while parked at the bottom.
    const query = makeQuery();
    const { result, rerender } = renderHook(() => useBottomPagination(query));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
