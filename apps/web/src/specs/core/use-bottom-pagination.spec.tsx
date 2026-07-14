import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBottomPagination } from "@/core/hooks/use-bottom-pagination";

// The DetectBottom load-more callback has three failure modes this hook
// exists to prevent: aborting an in-flight fetch (fetchNextPage defaults to
// cancelRefetch: true), silently joining a background refetch without ever
// queuing the requested page (the sentinel must retry when the fetch ends),
// and dead-ending a query seeded with initialData: { pages: [] }
// (hasNextPage is false with zero pages and refetchOnMount is false
// app-wide, so the sentinel IS the page-1 bootstrap).

function makeQuery(overrides: Partial<Parameters<typeof useBottomPagination>[0]> = {}) {
  return {
    data: { pages: [["a"]] },
    hasNextPage: true,
    isFetching: false,
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

  it("no-ops while ANY fetch is in flight (next page or background refetch)", () => {
    // With cancelRefetch: false a call during a background refetch would
    // silently join it and the next page would never be queued — so the
    // guard must wait out every fetch, not just next-page ones.
    const query = makeQuery({ isFetching: true });
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
    // A fresh data object with the same page count must not break stability
    // (the hook derives a boolean, not the object reference).
    const base = makeQuery();
    const { result, rerender } = renderHook((q) => useBottomPagination(q), {
      initialProps: base
    });
    const first = result.current;
    rerender({ ...base, data: { pages: [["b"]] } });
    expect(result.current).toBe(first);
  });

  it("mints a new identity when a fetch completes so a visible sentinel retries", () => {
    // The stall guard's other half: a bottom call during a fetch no-ops, so
    // the fetch finishing (isFetching true -> false) must change the callback
    // identity — that re-runs DetectBottom's effect and issues the queued
    // page instead of stalling until the user scrolls away and back.
    const base = makeQuery({ isFetching: true });
    const { result, rerender } = renderHook((q) => useBottomPagination(q), {
      initialProps: base
    });
    const during = result.current;
    rerender({ ...base, isFetching: false });
    expect(result.current).not.toBe(during);
  });
});
