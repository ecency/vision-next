import { CONFIG } from "@/modules/core/config";
import { queryOptions } from "@tanstack/react-query";

export function getSearchAccountsByUsernameQueryOptions(
  query: string,
  limit = 5,
  excludeList: string[] = []
) {
  return queryOptions({
    queryKey: ["accounts", "search", query, excludeList],
    enabled: !!query,
    queryFn: async () => {
      const response = (await CONFIG.hiveClient.database.call(
        "lookup_accounts",
        [query, limit]
      )) as string[];
      return response.filter((item) =>
        excludeList.length > 0 ? !excludeList.includes(item) : true
      );
    },
  });
}
