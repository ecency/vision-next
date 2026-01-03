import { EcencyQueriesManager } from "@/core/react-query";
import { Community } from "@/entities";
import { getCommunitySubscribersQueryOptions } from "@ecency/sdk";

export function getCommunitySubscribersQuery(community: Community) {
  return EcencyQueriesManager.generateClientServerQuery(
    getCommunitySubscribersQueryOptions(community.name)
  );
}
