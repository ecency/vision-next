import dayjs from "@/utils/dayjs";
import { MarketCandlestickDataItem } from "@/entities";
import { useInfiniteQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { getMarketHistoryQueryOptions, getQueryClient } from "@ecency/sdk";
import { Time } from "lightweight-charts";
import { useMemo } from "react";

export interface TradingViewQueryDataItem {
  close: number;
  open: number;
  low: number;
  high: number;
  volume: number;
  time: Time;
}

export function useTradingViewQuery(bucketSeconds: number) {
  const { initialStartDate, initialEndDate } = useMemo(() => {
    const end = dayjs();
    const start = end.clone().subtract(Math.max(100 * bucketSeconds, 28_800), "second");
    return { initialStartDate: start, initialEndDate: end };
  }, [bucketSeconds]);

  return useInfiniteQuery({
    queryKey: [
      QueryIdentifiers.MARKET_TRADING_VIEW,
      bucketSeconds,
      initialStartDate.toISOString(),
      initialEndDate.toISOString()
    ],
    queryFn: async ({ pageParam: [startDate, endDate] }) => {
      const apiData: MarketCandlestickDataItem[] = await getQueryClient().fetchQuery(
        getMarketHistoryQueryOptions(bucketSeconds, startDate.toDate(), endDate.toDate())
      );

      return apiData.map(({ hive, non_hive, open }) => ({
        close: non_hive.close / hive.close,
        open: non_hive.open / hive.open,
        low: non_hive.low / hive.low,
        high: non_hive.high / hive.high,
        volume: hive.volume,
        time: Math.floor(dayjs(open).toDate().getTime() / 1000) as Time
      }));
    },
    initialPageParam: [
      // Fetch at least 8 hours or given interval
      initialStartDate,
      initialEndDate
    ],
    getNextPageParam: (_, __, [prevStartDate]) => [
      prevStartDate.clone().subtract(Math.max(100 * bucketSeconds, 28_800), "seconds"),
      prevStartDate.subtract(bucketSeconds, "seconds")
    ]
  });
}
