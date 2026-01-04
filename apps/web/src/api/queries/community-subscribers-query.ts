import { Community } from "@/entities";
import { getCommunitySubscribersQueryOptions } from "@ecency/sdk";

export function getCommunitySubscribersQuery(community: Community) {
  return getCommunitySubscribersQueryOptions(community.name);
}
