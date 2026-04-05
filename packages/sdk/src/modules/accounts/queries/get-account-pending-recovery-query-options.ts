import { QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { callRPC } from "@/modules/core/hive-tx";

export function getAccountPendingRecoveryQueryOptions(
  username: string | undefined
) {
  return queryOptions({
    enabled: !!username,
    queryKey: QueryKeys.accounts.pendingRecovery(username!),
    queryFn: () =>
      callRPC("database_api.find_change_recovery_account_requests", { accounts: [username] }),
  });
}
