import { useQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { CONFIG } from "@ecency/sdk";

export function useMarketBucketSizeQuery() {
  return useQuery({
    queryKey: [QueryIdentifiers.MARKET_BUCKET_SIZE],
    queryFn: () =>
      CONFIG.hiveClient.call(
        "condenser_api",
        "get_market_history_buckets",
        []
      ) as Promise<number[]>
  });
}
