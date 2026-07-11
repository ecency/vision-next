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
      // A correct node always answers get_accounts with an array — a null
      // result in a well-formed envelope is a node fault (observed in the
      // wild), so the validator makes callRPC fail over to the next node
      // instead of resolving with a payload parseAccounts cannot map over.
      const response = (await callRPC(
        "condenser_api.get_accounts",
        [usernames],
        undefined,
        undefined,
        undefined,
        (rows) => Array.isArray(rows)
      )) as any[];
      return parseAccounts(response ?? []);
    },
  });
}
