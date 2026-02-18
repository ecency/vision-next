import { getQueryClient } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import type { GeneralAssetInfo } from "@/modules/wallet/types";
import { getPointsQueryOptions } from "./get-points-query-options";

export function getPointsAssetGeneralInfoQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "points", "general-info", username],
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(getPointsQueryOptions(username));
      const data = getQueryClient().getQueryData(
        getPointsQueryOptions(username).queryKey
      );
      return {
        name: "POINTS",
        title: "Ecency Points",
        price: 0.002,
        accountBalance: +(data?.points ?? 0),
      } satisfies GeneralAssetInfo;
    },
  });
}
