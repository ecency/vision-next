import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { getProfiles } from "@/modules/bridge";
import { Profile } from "@/modules/accounts/types";
import { callRPC } from "@/modules/core/hive-tx";

export function getSearchAccountQueryOptions(q: string, limit = 5) {
  const normalized = q.trim();

  return queryOptions({
    queryKey: QueryKeys.search.account(normalized, limit),
    queryFn: async (): Promise<Profile[]> => {
      const usernames = (await callRPC("condenser_api.lookup_accounts", [
        normalized,
        limit,
      ])) as string[];

      if (usernames.length === 0) {
        return [];
      }

      return getProfiles(usernames);
    },
    enabled: !!normalized,
  });
}
