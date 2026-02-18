import { CONFIG, QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

export function getAccountPendingRecoveryQueryOptions(
  username: string | undefined
) {
  return queryOptions({
    enabled: !!username,
    queryKey: QueryKeys.accounts.pendingRecovery(username!),
    queryFn: () =>
      CONFIG.hiveClient.call(
        "database_api",
        "find_change_recovery_account_requests",
        { accounts: [username] }
      ),
  });
}
