import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBottomPagination } from "@/core/hooks/use-bottom-pagination";

// The DetectBottom load-more callback has four failure modes this hook exists
// to prevent: aborting an in-flight fetch (fetchNextPage defaults to
// cancelRefetch: true), silently joining a background refetch without a later
// retrigger for the swallowed page request, looping requests during an API
// outage (retriggering off isFetching re-fires after FAILED fetches too), and
// dead-ending a query seeded with initialData: { pages: [] } (hasNextPage is
// false with zero pages and refetchOnMount is false app-wide, so the sentinel
// IS the page-1 bootstrap).

function makeQuery(overrides: Partial<Parameters<typeof useBottomPagination>[0]> = {}) {
  return {
    data: { pages: [["a"]] },
    dataUpdatedAt: 1000,
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
    // guard waits out every fetch; the success retrigger below issues
    // anything swallowed.
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

  it("mints a new identity when a fetch SUCCEEDS so a visible sentinel retries", () => {
    // A bottom call during a fetch no-ops, so successful completion
    // (dataUpdatedAt advances) must change the callback identity — that
    // re-runs DetectBottom's effect and issues the queued page instead of
    // stalling until the user scrolls away and back.
    const base = makeQuery({ isFetching: true });
    const { result, rerender } = renderHook((q) => useBottomPagination(q), {
      initialProps: base
    });
    const during = result.current;
    rerender({ ...base, isFetching: false, dataUpdatedAt: 2000 });
    expect(result.current).not.toBe(during);
  });

  it("keeps the SAME identity when a fetch FAILS (no outage retry loop)", () => {
    // On failure isFetching flips back to false but dataUpdatedAt does not
    // advance. The identity must not change: a change would re-run
    // DetectBottom's effect while the sentinel is visible and immediately
    // refetch — combined with React Query's internal retries, an API outage
    // would generate requests indefinitely. Recovery comes from a fresh user
    // signal (viewport re-entry, load-more click) instead.
    const base = makeQuery({ isFetching: true });
    const { result, rerender } = renderHook((q) => useBottomPagination(q), {
      initialProps: base
    });
    const during = result.current;
    rerender({ ...base, isFetching: false });
    expect(result.current).toBe(during);
  });

  it("can retry after a failed fetch even when the callback was minted mid-flight", () => {
    // Stale-closure regression: a callback created while a fetch is in
    // flight (e.g. a list that mounts fetching) whose fetch then FAILS gets
    // no dep change — a closure-captured isFetching would stay true forever
    // and viewport re-entry / load-more clicks could never retry. The
    // latest-value ref must see the idle state.
    const base = makeQuery({ isFetching: true });
    const { result, rerender } = renderHook((q) => useBottomPagination(q), {
      initialProps: base
    });
    result.current();
    expect(base.fetchNextPage).not.toHaveBeenCalled();

    rerender({ ...base, isFetching: false });
    result.current();
    expect(base.fetchNextPage).toHaveBeenCalledTimes(1);
    expect(base.fetchNextPage).toHaveBeenCalledWith({ cancelRefetch: false });
  });
});
