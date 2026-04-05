import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { parseAccounts } from "../utils/parse-accounts";
import { FullAccount } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

export function getAccountsQueryOptions(usernames: string[]) {
  return queryOptions({
    queryKey: QueryKeys.accounts.list(...usernames),
    enabled: usernames.length > 0,
    queryFn: async (): Promise<FullAccount[]> => {
      const response = (await callRPC("condenser_api.get_accounts", [usernames])) as any[];
      return parseAccounts(response);
    },
  });
}
