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

  const fetchAllStats = useCallback(async () => {
    // cancelRefetch: false joins a still-in-flight request instead of aborting
    // it — the transactions history walk can outlive one poll tick on slow
    // public nodes, and restarting it every tick would keep it from ever
    // completing (a frozen trade-history widget).
    reFetchAllStats({ cancelRefetch: false });
    reFetchOrderBook({ cancelRefetch: false });
    if (activeUsername) {
      reFetchOpenOrders({ cancelRefetch: false });
      reFetchTransactions({ cancelRefetch: false });
    }

    try {
      const usdResponse = await getCGMarket(MarketAsset.HIVE, MarketAsset.HBD);
      if (usdResponse[0]) {
        onUsdChange(usdResponse[0]);
      }
    } catch {
      // No caller awaits this function (interval/mount/refresh effect), so a
      // failed CoinGecko lookup must not escape as an unhandled rejection —
      // the USD price keeps its last value until the next tick.
    }
  }, [activeUsername, onUsdChange, reFetchAllStats, reFetchOpenOrders, reFetchOrderBook, reFetchTransactions]);

  useEffect(() => {
    setAllOrders(
      transactions?.pages?.[0]?.entries?.filter((item) => item.type === "limit_order_create") ?? []
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
    fetchAllStats();
    setRefresh(false);
  }, [fetchAllStats, refresh, setRefresh]);

  return <></>;
};
