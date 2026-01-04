import React, { useCallback, useEffect } from "react";
import { DayChange } from "@/app/market/advanced/_advanced-mode/types/day-change.type";
import { OpenOrdersData, OrdersData, Transaction } from "@/entities";
import useInterval from "react-use/lib/useInterval";
import { getCGMarket } from "@/api/coingecko-api";
import { MarketAsset } from "@/api/market-pair";
import { getHiveHbdStatsQuery } from "@/api/queries";
import { getOpenOrdersQueryOptions, getOrderBookQueryOptions, getTransactionsInfiniteQueryOptions } from "@ecency/sdk";
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
  const { data: allStats, refetch: reFetchAllStats } = getHiveHbdStatsQuery().useClientQuery();
  const { data: orderBook, refetch: reFetchOrderBook } = useQuery(getOrderBookQueryOptions(100));
  const { data: openOrders, refetch: reFetchOpenOrders } = useQuery(getOpenOrdersQueryOptions(
    activeUsername ?? ""
  ));

  const fetchAllStats = useCallback(async () => {
    reFetchAllStats();
    reFetchOrderBook();
    if (activeUsername) {
      reFetchOpenOrders();
      reFetchTransactions();
    }

    const usdResponse = await getCGMarket(MarketAsset.HIVE, MarketAsset.HBD);
    if (usdResponse[0]) {
      onUsdChange(usdResponse[0]);
    }
  }, [activeUsername, onUsdChange, reFetchAllStats, reFetchOpenOrders, reFetchOrderBook, reFetchTransactions]);

  useEffect(() => {
    setAllOrders(
      transactions?.pages?.[0]?.filter((item) => item.type === "limit_order_create") ?? []
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
    fetchAllStats();
    setRefresh(false);
  }, [fetchAllStats, refresh, setRefresh]);

  return <></>;
};
