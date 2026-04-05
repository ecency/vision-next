import { callRPC } from "@/modules/core/hive-tx";
import type { RCAccount } from "@/modules/core/hive-tx";
import { queryOptions } from "@tanstack/react-query";

export function getAccountRcQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["resource-credits", "account", username],
    queryFn: async (): Promise<RCAccount[]> => {
      const result = await callRPC("rc_api.find_rc_accounts", {
        accounts: [username],
      });
      return result.rc_accounts;
    },
    enabled: !!username,
  });
}
