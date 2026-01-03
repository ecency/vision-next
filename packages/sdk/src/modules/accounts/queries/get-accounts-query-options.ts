import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { parseAccounts } from "../utils";

/**
 * Get multiple accounts by usernames
 */
export function getAccountsQueryOptions(usernames: string[]) {
  return queryOptions({
    queryKey: ["accounts", "get-accounts", usernames],
    queryFn: async () => {
      const response = await CONFIG.hiveClient.database.getAccounts(usernames);
      return parseAccounts(response);
    },
    enabled: usernames.length > 0,
  });
}
