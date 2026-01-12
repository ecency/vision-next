import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { parseAccounts } from "../utils/parse-accounts";
import { FullAccount } from "../types";

export function getAccountsQueryOptions(usernames: string[]) {
  return queryOptions({
    queryKey: ["accounts", "list", ...usernames],
    enabled: usernames.length > 0,
    queryFn: async (): Promise<FullAccount[]> => {
      const response = (await CONFIG.hiveClient.database.getAccounts(
        usernames
      )) as any[];
      return parseAccounts(response);
    },
  });
}
