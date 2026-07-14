import { useCallback } from "react";
import useLatest from "react-use/lib/useLatest";

interface BottomPaginationQuery {
  data?: { pages: unknown[] };
  dataUpdatedAt: number;
  hasNextPage: boolean;
  isFetching: boolean;
  fetchNextPage: (options?: { cancelRefetch?: boolean }) => Promise<unknown>;
}

/**
 * Stable load-more callback for a `DetectBottom` sentinel over an infinite
 * query. The hazards that make the naive `onBottom={() => fetchNextPage()}`
 * wrong:
 *
 * - `fetchNextPage()` defaults to `cancelRefetch: true`, so a re-render while
 *   a fetch is in flight (DetectBottom re-runs its effect whenever the
 *   callback identity changes) aborts and restarts that fetch — the
 *   cancellation-AbortError churn. `cancelRefetch: false` joins it instead.
 * - A call landing during a BACKGROUND refetch silently joins it and the next
 *   page is never queued, so a still-visible sentinel needs a retrigger when
 *   the refetch ends. The callback identity is keyed on `dataUpdatedAt` — the
 *   SUCCESS timestamp — so completion re-runs DetectBottom's effect and
 *   issues the queued page. Keying on `isFetching` instead would also
 *   retrigger after a FAILED fetch (isFetching flips back to false), and with
 *   `hasNextPage` still true that immediately refetches: an API outage would
 *   loop requests indefinitely. On failure nothing here changes, so the
 *   sentinel stops; a fresh user signal (re-entering the viewport, a
 *   load-more click) retries.
 * - A query seeded with `initialData: { pages: [] }` is "success" with
 *   `hasNextPage` false and never auto-fetches (`refetchOnMount` is false
 *   app-wide), so the sentinel's call is what bootstraps page 1. Gating on
 *   `hasNextPage` alone would leave such a list permanently empty; the
 *   no-pages arm keeps the bootstrap.
 *
 * `isFetching` is read through a latest-value ref, NOT captured in the
 * closure and NOT an identity dependency (that would reintroduce the failure
 * loop). A closure capture would go one worse: a callback minted while a
 * fetch is in flight (e.g. the waves list mounts fetching) whose fetch then
 * FAILS keeps `isFetching=true` forever — no dep changes on failure — and
 * every retry would no-op. The ref is written during render (useLatest), not
 * in an effect: a child sentinel's effect runs BEFORE this hook owner's
 * effects in the same commit, so an effect-updated ref would still read
 * stale there and swallow the success retrigger.
 */
export function useBottomPagination({
  data,
  dataUpdatedAt,
  hasNextPage,
  isFetching,
  fetchNextPage
}: BottomPaginationQuery) {
  const hasPages = (data?.pages?.length ?? 0) > 0;
  const isFetchingRef = useLatest(isFetching);
  return useCallback(() => {
    if (isFetchingRef.current) {
      return;
    }
    if (hasNextPage || !hasPages) {
      fetchNextPage({ cancelRefetch: false });
    }
    // dataUpdatedAt is an intentional extra dependency — it is the success
    // retrigger described above, not a value the callback reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchNextPage, hasNextPage, hasPages, isFetchingRef, dataUpdatedAt]);
}
