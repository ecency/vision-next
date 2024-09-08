import { useQuery } from "@tanstack/react-query";
import { Subscription } from "@/entities";
import { bridgeApiCall } from "@/api/bridge";
import { QueryIdentifiers } from "@/core/react-query";

export function useGetSubscriptionsQuery(username?: string) {
  return useQuery({
    queryKey: [QueryIdentifiers.SUBSCRIPTIONS, username],
    queryFn: async () => {
      const response = await bridgeApiCall<Subscription[] | null>("list_all_subscriptions", {
        account: username
      });
      return response ?? [];
    },
    enabled: !!username
  });
}
