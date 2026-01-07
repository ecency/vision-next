import { queryOptions } from "@tanstack/react-query";
import { Community } from "../types/community";
import { getCommunity } from "@/modules/bridge";

export function getCommunityQueryOptions(
  name: string | undefined,
  observer: string | undefined = "",
  enabled = true
) {
  return queryOptions({
    queryKey: ["community", "single", name, observer],
    enabled: enabled && !!name,
    queryFn: async () => getCommunity(name ?? "", observer) as Promise<Community | null>,
  });
}
