import { CONFIG, QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

type Subscriptions = string[];

export function getAccountSubscriptionsQueryOptions(
  username: string | undefined
) {
  return queryOptions({
    queryKey: QueryKeys.accounts.subscriptions(username!),
    enabled: !!username,
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call(
        "bridge",
        "list_all_subscriptions",
        {
          account: username,
        }
      );
      return (response ?? []) as Subscriptions;
    },
  });
}
