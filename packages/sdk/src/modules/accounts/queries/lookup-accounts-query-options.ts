import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { QueryKeys } from "@/modules/core";

/**
 * Lookup accounts by username prefix
 *
 * @param query - Username prefix to search for
 * @param limit - Maximum number of results (default: 50)
 */
export function lookupAccountsQueryOptions(query: string, limit = 50) {
  return queryOptions({
    queryKey: QueryKeys.accounts.lookup(query, limit),
    queryFn: () =>
      CONFIG.hiveClient.database.call("lookup_accounts", [
        query,
        limit,
      ]) as Promise<string[]>,
    enabled: !!query,
    staleTime: Infinity,
  });
}
