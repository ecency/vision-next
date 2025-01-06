import { useQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { client } from "@/api/hive";

export function useMarketBucketSizeQuery() {
  return useQuery({
    queryKey: [QueryIdentifiers.MARKET_BUCKET_SIZE],
    queryFn: () =>
      client.call("condenser_api", "get_market_history_buckets", []) as Promise<number[]>
  });
}
