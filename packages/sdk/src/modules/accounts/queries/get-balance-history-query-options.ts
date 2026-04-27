import { infiniteQueryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { callREST } from "@/modules/core/hive-tx";
import type {
  BalanceCoinType,
  BalanceHistoryEntry,
  BalanceHistoryResponse,
} from "../types";

interface BalanceHistoryPage {
  entries: BalanceHistoryEntry[];
  currentPage: number;
}

/**
 * Cursor for balance history pagination.
 * null = first request (returns the newest page).
 * number = specific page to fetch (decrementing for older data).
 */
type BalanceHistoryCursor = number | null;

/**
 * Get balance history for an account with pagination, newest first.
 * Uses the balance-api REST endpoint with direction=desc.
 *
 * Pagination: first call omits `page` to get the newest data.
 * The response includes `total_pages` so we know the current page number.
 * Subsequent calls decrement the page number to load older data.
 *
 * @param username - Account name
 * @param coinType - HIVE, HBD, or VESTS
 * @param pageSize - Number of entries per page
 */
export function getBalanceHistoryInfiniteQueryOptions(
  username?: string,
  coinType: BalanceCoinType = "HIVE",
  pageSize = 200
) {
  return infiniteQueryOptions<
    BalanceHistoryPage,
    Error,
    BalanceHistoryPage,
    (string | number)[],
    BalanceHistoryCursor
  >({
    queryKey: QueryKeys.wallet.balanceHistory(
      username ?? "",
      coinType,
      pageSize
    ),
    initialPageParam: null as BalanceHistoryCursor,

    queryFn: async ({ pageParam }) => {
      if (!username) {
        return { entries: [], currentPage: 0 };
      }

      const params: Record<string, any> = {
        "account-name": username,
        "coin-type": coinType,
        "page-size": pageSize,
        direction: "desc",
      };

      // First call: omit page to get newest data
      // Subsequent calls: pass specific page number
      if (pageParam !== null) {
        params.page = pageParam;
      }

      const response = (await callREST(
        "balance",
        "/accounts/{account-name}/balance-history",
        params
      )) as BalanceHistoryResponse;

      return {
        entries: response.operations_result,
        currentPage: pageParam ?? response.total_pages,
      };
    },

    getNextPageParam: (lastPage) => {
      // Decrement page to go further back in time
      const nextPage = lastPage.currentPage - 1;
      return nextPage >= 1 ? nextPage : undefined;
    },

    enabled: !!username,
  });
}
