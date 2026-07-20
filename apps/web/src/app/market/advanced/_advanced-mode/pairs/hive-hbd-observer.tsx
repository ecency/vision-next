import React, { useCallback, useEffect } from "react";
import { DayChange } from "@/app/market/advanced/_advanced-mode/types/day-change.type";
import { OpenOrdersData, OrdersData, Transaction } from "@/entities";
import useInterval from "react-use/lib/useInterval";
import { getCGMarket } from "@/api/coingecko-api";
import { MarketAsset } from "@/api/market-pair";
import { getHiveHbdStatsQueryOptions, getOpenOrdersQueryOptions, getOrderBookQueryOptions, getTransactionsInfiniteQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import useMount from "react-use/lib/useMount";
import { useActiveAccount } from "@/core/hooks";

interface Props {
  onDayChange: (dayChange: DayChange) => void;
  onHistoryChange: (history: OrdersData) => void;
  onUsdChange: (usdPrice: number) => void;
  refresh: boolean;
  setRefresh: (v: boolean) => void;
  setOpenOrders: (data: OpenOrdersData[]) => void;
  setAllOrders: (value: Transaction[]) => void;
  updateRate: number;
}

export const HiveHbdObserver = ({
  onDayChange,
  onHistoryChange,
  onUsdChange,
  refresh,
  setRefresh,
  setOpenOrders,
  setAllOrders,
  updateRate
}: Props) => {
  const { username: activeUsername } = useActiveAccount();
  const { data: transactions, refetch: reFetchTransactions } = useInfiniteQuery(getTransactionsInfiniteQueryOptions(
    activeUsername ?? undefined,
    50,
    "market-orders"
  ));
  const { data: allStats, refetch: reFetchAllStats } = useQuery(getHiveHbdStatsQueryOptions());
  const { data: orderBook, refetch: reFetchOrderBook } = useQuery(getOrderBookQueryOptions(100));
  const { data: openOrders, refetch: reFetchOpenOrders } = useQuery(getOpenOrdersQueryOptions(
    activeUsername ?? ""
  ));

  const fetchAllStats = useCallback(
    async (postTrade = false) => {
      // Poll ticks join a still-in-flight request (cancelRefetch: false) — the
      // transactions history walk can outlive one tick on slow public nodes,
      // and restarting it every tick would keep it from ever completing (a
      // frozen trade-history widget). The post-trade refresh is the opposite
      // case: an in-flight request may predate the trade, so it must be
      // cancelled and reissued for the new order to show up.
      const options = { cancelRefetch: postTrade };
      reFetchAllStats(options);
      reFetchOrderBook(options);
      if (activeUsername) {
        reFetchOpenOrders(options);
        reFetchTransactions(options);
      }

      let usdResponse: number[];
      try {
        usdResponse = await getCGMarket(MarketAsset.HIVE, MarketAsset.HBD);
      } catch {
        // No caller awaits this function (interval/mount/refresh effect), so a
        // failed CoinGecko lookup must not escape as an unhandled rejection.
        // Publish 0 — the shared "no quote" value the USD displays hide on —
        // so an outage doesn't leave an old quote rendered as current; the
        // next successful tick restores it.
        onUsdChange(0);
        return;
      }
      // Normalize any unusable quote (0/undefined/NaN) through the same
      // "no quote" sentinel as the catch path, so a degraded response also
      // clears a previously rendered price.
      onUsdChange(usdResponse[0] || 0);
    },
    [activeUsername, onUsdChange, reFetchAllStats, reFetchOpenOrders, reFetchOrderBook, reFetchTransactions]
  );

  useEffect(() => {
    setAllOrders(
      transactions?.pages?.[0]?.entries?.filter(
        (item) => item.type === "limit_order_create"
      ) ?? []
    );
  }, [setAllOrders, transactions]);

  useEffect(() => {
    if (!activeUsername) {
      setOpenOrders([]);
      setAllOrders([]);
    }
  }, [activeUsername, setAllOrders, setOpenOrders]);

  useInterval(() => fetchAllStats(), updateRate);

  useMount(() => {
    fetchAllStats();
  });

  useEffect(() => {
    if (allStats) {
      onDayChange(allStats);
    }
  }, [allStats, onDayChange]);

  useEffect(() => {
    if (orderBook) {
      onHistoryChange(orderBook);
    }
  }, [onHistoryChange, orderBook]);

  useEffect(() => {
    if (openOrders) {
      setOpenOrders(openOrders);
    }
  }, [openOrders, setOpenOrders]);

  useEffect(() => {
    // `refresh` (set after a successful trade) is the only trigger here; the
    // mount fetch is handled by useMount above. Ungated, this effect re-fired
    // a full four-query round every time a parent re-render changed
    // fetchAllStats' identity.
    if (!refresh) {
      return;
    }
    fetchAllStats(true);
    setRefresh(false);
  }, [fetchAllStats, refresh, setRefresh]);

  return <></>;
};
