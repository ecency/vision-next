import { useCallback } from "react";

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
 * `isFetching` is deliberately read WITHOUT being an identity dependency (it
 * would reintroduce the failure loop). The captured value can therefore be
 * stale, which is safe: a stale-false call just joins the in-flight fetch
 * (never aborts it) and the success retrigger issues anything swallowed.
 */
export function useBottomPagination({
  data,
  dataUpdatedAt,
  hasNextPage,
  isFetching,
  fetchNextPage
}: BottomPaginationQuery) {
  const hasPages = (data?.pages?.length ?? 0) > 0;
  return useCallback(() => {
    if (isFetching) {
      return;
    }
    if (hasNextPage || !hasPages) {
      fetchNextPage({ cancelRefetch: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchNextPage, hasNextPage, hasPages, dataUpdatedAt]);
}
