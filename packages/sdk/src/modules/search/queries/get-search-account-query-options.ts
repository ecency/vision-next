import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { getProfiles } from "@/modules/bridge";
import { Profile } from "@/modules/accounts/types";

export function getSearchAccountQueryOptions(q: string, limit = 5) {
  return queryOptions({
    queryKey: ["search", "account", q, limit],
    queryFn: async (): Promise<Profile[]> => {
      const usernames = (await CONFIG.hiveClient.database.call("lookup_accounts", [
        q,
        limit,
      ])) as string[];

      if (usernames.length === 0) {
        return [];
      }

      return getProfiles(usernames);
    },
    enabled: !!q,
  });
}
