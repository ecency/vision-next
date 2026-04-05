import { QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { callRPC } from "@/modules/core/hive-tx";

export function getSearchAccountsByUsernameQueryOptions(
  query: string,
  limit = 5,
  excludeList: string[] = []
) {
  return queryOptions({
    queryKey: QueryKeys.accounts.search(query, excludeList),
    enabled: !!query,
    queryFn: async () => {
      const response = (await callRPC("condenser_api.lookup_accounts", [query, limit])) as string[];
      return response.filter((item) =>
        excludeList.length > 0 ? !excludeList.includes(item) : true
      );
    },
  });
}
