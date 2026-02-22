import { queryOptions } from "@tanstack/react-query";
import { Community } from "../types/community";
import { getCommunity } from "@/modules/bridge";
import { QueryKeys } from "@/modules/core";

export function getCommunityQueryOptions(
  name: string | undefined,
  observer: string | undefined = "",
  enabled = true
) {
  return queryOptions({
    queryKey: QueryKeys.communities.single(name, observer),
    enabled: enabled && !!name,
    queryFn: async () => getCommunity(name ?? "", observer) as Promise<Community | null>,
  });
}
