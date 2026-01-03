import { EcencyQueriesManager } from "@/core/react-query";
import { Community } from "@/entities";
import { getAccountNotificationsInfiniteQueryOptions } from "@ecency/sdk";

export function getAccountNotificationsQuery(community: Community, limit: number) {
  return EcencyQueriesManager.generateClientServerInfiniteQuery(
    getAccountNotificationsInfiniteQueryOptions(community.name, limit)
  );
}
