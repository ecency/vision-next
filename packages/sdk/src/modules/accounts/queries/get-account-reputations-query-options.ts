import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { QueryKeys } from "@/modules/core";
import { AccountReputation } from "../types";

export function getAccountReputationsQueryOptions(query: string, limit = 50) {
  return queryOptions({
    queryKey: QueryKeys.accounts.reputations(query, limit),
    enabled: !!query,
    queryFn: async (): Promise<AccountReputation[]> => {
      if (!query) {
        return [];
      }

      return CONFIG.hiveClient.call(
        "condenser_api",
        "get_account_reputations",
        [query, limit]
      ) as Promise<AccountReputation[]>;
    },
  });
}
