import { CONFIG } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

type Subscriptions = string[];

export function getAccountSubscriptionsQueryOptions(
  username: string | undefined
) {
  return queryOptions({
    queryKey: ["accounts", "subscriptions", username],
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
