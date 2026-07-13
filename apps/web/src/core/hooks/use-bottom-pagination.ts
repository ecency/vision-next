import { useCallback } from "react";

interface BottomPaginationQuery {
  data?: { pages: unknown[] };
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: (options?: { cancelRefetch?: boolean }) => Promise<unknown>;
}

/**
 * Stable load-more callback for a `DetectBottom` sentinel over an infinite
 * query. Two hazards make the naive `onBottom={() => fetchNextPage()}` wrong:
 *
 * - `fetchNextPage()` defaults to `cancelRefetch: true`, so a re-render while
 *   a fetch is in flight (DetectBottom re-runs its effect whenever the
 *   callback identity changes) aborts and restarts that fetch — the
 *   cancellation-AbortError churn. `cancelRefetch: false` joins it instead.
 * - A query seeded with `initialData: { pages: [] }` is "success" with
 *   `hasNextPage` false and never auto-fetches (`refetchOnMount` is false
 *   app-wide), so the sentinel's unguarded call is what bootstraps page 1.
 *   Gating on `hasNextPage` alone would leave such a list permanently empty;
 *   the no-pages arm keeps the bootstrap.
 */
export function useBottomPagination({
  data,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage
}: BottomPaginationQuery) {
  const hasPages = (data?.pages?.length ?? 0) > 0;
  return useCallback(() => {
    if (isFetchingNextPage) {
      return;
    }
    if (hasNextPage || !hasPages) {
      fetchNextPage({ cancelRefetch: false });
    }
  }, [fetchNextPage, hasNextPage, hasPages, isFetchingNextPage]);
}
