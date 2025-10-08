import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { SpkMarkets, TransformedSpkMarkets } from "../../types";

export function getSpkMarketsQueryOptions() {
  return queryOptions({
    queryKey: ["assets", "spk", "markets"],
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      const response = await fetch(`${CONFIG.spkNode}/markets`);
      const data = (await response.json()) as SpkMarkets;

      return {
        list: Object.entries(data.markets.node).map(([name, node]) => ({
          name,
          status:
            node.lastGood >= data.head_block - 1200
              ? "🟩"
              : node.lastGood > data.head_block - 28800
                ? "🟨"
                : "🟥",
        })),
        raw: data,
      } satisfies TransformedSpkMarkets;
    },
  });
}
