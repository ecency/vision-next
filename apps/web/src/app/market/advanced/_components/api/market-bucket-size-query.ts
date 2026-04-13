import { useQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { callRPC } from "@ecency/sdk";

export function useMarketBucketSizeQuery() {
  return useQuery({
    queryKey: [QueryIdentifiers.MARKET_BUCKET_SIZE],
    queryFn: () => {
      return callRPC(
        "condenser_api.get_market_history_buckets",
        []
      ) as Promise<number[]>;
    }
  });
}
