import { useCallback } from "react";

interface BottomPaginationQuery {
  data?: { pages: unknown[] };
  hasNextPage: boolean;
  isFetching: boolean;
  fetchNextPage: (options?: { cancelRefetch?: boolean }) => Promise<unknown>;
}

/**
 * Stable load-more callback for a `DetectBottom` sentinel over an infinite
 * query. Three hazards make the naive `onBottom={() => fetchNextPage()}`
 * wrong:
 *
 * - `fetchNextPage()` defaults to `cancelRefetch: true`, so a re-render while
 *   a fetch is in flight (DetectBottom re-runs its effect whenever the
 *   callback identity changes) aborts and restarts that fetch — the
 *   cancellation-AbortError churn. `cancelRefetch: false` joins it instead.
 * - Joining is only safe when nothing is in flight to join: with
 *   `cancelRefetch: false` a call during a background refetch silently
 *   returns that refetch's promise and the next page is never queued. The
 *   guard therefore waits out ANY fetch (`isFetching`, which also covers
 *   next-page fetches) — and because `isFetching` is a dependency of the
 *   callback, its completion mints a new identity, re-running DetectBottom's
 *   effect so a still-visible sentinel retries instead of stalling.
 * - A query seeded with `initialData: { pages: [] }` is "success" with
 *   `hasNextPage` false and never auto-fetches (`refetchOnMount` is false
 *   app-wide), so the sentinel's call is what bootstraps page 1. Gating on
 *   `hasNextPage` alone would leave such a list permanently empty; the
 *   no-pages arm keeps the bootstrap.
 */
export function useBottomPagination({
  data,
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
  }, [fetchNextPage, hasNextPage, hasPages, isFetching]);
}
