"use client";

import { useGlobalStore } from "@/core/global-store";
import {
  getBalanceHistoryInfiniteQueryOptions,
  getDynamicPropsQueryOptions,
  vestsToHp,
  type BalanceCoinType,
  type BalanceHistoryEntry,
} from "@ecency/sdk";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createChart, IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
import i18next from "i18next";
import { Spinner } from "@/features/ui/spinner";

interface Props {
  username: string;
  coinType: BalanceCoinType;
}

/** Convert raw API balance integer to human-readable value */
function toHumanBalance(
  raw: number,
  coinType: BalanceCoinType,
  hivePerMVests: number
): number {
  if (coinType === "VESTS") {
    // API returns micro-vests (6 decimals), divide by 1e6 to get standard VESTS
    return vestsToHp(raw / 1e6, hivePerMVests);
  }
  // HIVE/HBD: API returns millis (3 decimals)
  return raw / 1000;
}

export function BalanceHistoryChart({ username, coinType }: Props) {
  const theme = useGlobalStore((s) => s.theme);
  const { ref: chartContainerRef } = useResizeDetector();

  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const chartInitialized = useRef(false);

  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());
  const hivePerMVests = dynamicProps?.hivePerMVests ?? 0;

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery(
    getBalanceHistoryInfiniteQueryOptions(username, coinType, 200)
  );

  const pages = data?.pages as Array<{ entries: BalanceHistoryEntry[]; currentPage: number }> | undefined;

  const chartData = useMemo(() => {
    if (!pages || (coinType === "VESTS" && !hivePerMVests)) return [];

    return pages
      .flatMap((p) => p.entries)
      .map((entry: BalanceHistoryEntry) => ({
        time: (Math.floor(
          new Date(entry.timestamp + "Z").getTime() / 1000
        )) as Time,
        value: toHumanBalance(Number(entry.balance), coinType, hivePerMVests),
      }))
      .sort(
        (a: { time: Time }, b: { time: Time }) =>
          Number(a.time) - Number(b.time)
      );
  }, [pages, coinType, hivePerMVests]);

  const initChart = useCallback(() => {
    if (!chartContainerRef.current || chartInitialized.current) {
      return;
    }

    chartInitialized.current = true;

    const chart = createChart(chartContainerRef.current, {
      rightPriceScale: {
        scaleMargins: { top: 0.2, bottom: 0.1 },
        borderVisible: false,
      },
      timeScale: {
        timeVisible: true,
      },
      layout: {
        background: { color: "transparent" },
        textColor: theme === "night" ? "#fff" : "#000",
      },
      grid: {
        horzLines: {
          visible: true,
          color: "rgba(100, 100, 100, 0.2)",
          style: 1,
        },
        vertLines: {
          visible: true,
          color: "rgba(100, 100, 100, 0.2)",
          style: 1,
        },
      },
    });
    chartRef.current = chart;

    lineSeriesRef.current = chart.addLineSeries({
      color: "#2962FF",
      lineWidth: 2,
      priceFormat: {
        type: "price",
        precision: 3,
        minMove: 0.001,
      },
    });

    // Load more data when user scrolls to the left edge
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range && range.from < 10) {
        fetchNextPage();
      }
    });
  }, [theme, fetchNextPage]);

  // Initialize chart when container is available and data is ready
  useEffect(() => {
    if (
      chartData.length > 0 &&
      chartContainerRef.current &&
      !chartInitialized.current
    ) {
      initChart();
    }
  }, [chartData.length, initChart]);

  // Update chart data whenever it changes
  useEffect(() => {
    if (lineSeriesRef.current && chartData.length > 0) {
      lineSeriesRef.current.setData([]);
      lineSeriesRef.current.setData([...chartData]);

      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [chartData]);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        lineSeriesRef.current = null;
        chartInitialized.current = false;
      }
    };
  }, []);

  const showSpinner = (isLoading || isFetching) && chartData.length === 0;

  if (showSpinner) {
    return (
      <div className="bg-white dark:bg-dark-200 rounded-xl mb-4">
        <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
          {i18next.t("profile-wallet.balance-history")}
        </div>
        <div className="flex justify-center py-16">
          <Spinner className="w-6 h-6" />
        </div>
      </div>
    );
  }

  if (!isFetching && chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-dark-200 rounded-xl mb-4">
      <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
        {i18next.t("profile-wallet.balance-history")}
      </div>
      <div className="px-4 pb-4">
        <div className="h-[200px]" ref={chartContainerRef} />
      </div>
    </div>
  );
}
