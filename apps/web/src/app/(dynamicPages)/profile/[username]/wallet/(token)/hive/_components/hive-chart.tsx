import { useGlobalStore } from "@/core/global-store";
import { Button } from "@/features/ui";
import { useInfiniteDataFlow } from "@/utils";
import { getHiveAssetMetricQueryOptions } from "@ecency/wallets";
import { useInfiniteQuery } from "@tanstack/react-query";
import { UilArrowUpRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { createChart, IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { useEffect, useMemo, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
import { useMount } from "react-use";
import dayjs from "dayjs";

export function HiveChart() {
  const theme = useGlobalStore((s) => s.theme);

  const { ref: chartContainerRef, width, height } = useResizeDetector();

  const chartRef = useRef<IChartApi>();
  const candleStickSeriesRef = useRef<ISeriesApi<"Candlestick">>();

  const { data: dataPages } = useInfiniteQuery(getHiveAssetMetricQueryOptions(3_600));

  const data = useInfiniteDataFlow(dataPages);
  const uniqueData = useMemo(
    () =>
      data
        .sort((a, b) => Number(a.time) - Number(b.time))
        .map(({ time, ...item }) => ({
          ...item,
          time: Math.floor(dayjs(time).toDate().getTime() / 1000) as Time
        })),

    [data]
  );

  useMount(() => {
    if (!chartContainerRef.current || chartRef.current) {
      return;
    }

    const chartOptions = {
      rightPriceScale: {
        scaleMargins: {
          top: 0.3,
          bottom: 0.25
        },
        borderVisible: false
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true
      },
      layout: {
        background: {
          color: "transparent"
        },
        textColor: theme == "night" ? "#fff" : "#000"
      },
      grid: {
        horzLines: {
          visible: true,
          color: "rgba(100, 100, 100, 0.5)",
          style: 1,
          width: 1
        },
        vertLines: {
          visible: true,
          color: "rgba(100, 100, 100, 0.5)",
          style: 1,
          width: 1
        }
      }
    };
    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    candleStickSeriesRef.current = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      priceFormat: {
        type: "price",
        precision: 5,
        minMove: 0.00001
      }
    });
  });

  useEffect(() => {
    if (candleStickSeriesRef.current && uniqueData) {
      candleStickSeriesRef.current.setData([]);
      candleStickSeriesRef.current.setData([...uniqueData]);

      // Fit chart to data bounds
      if (chartRef.current && uniqueData.length > 0) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [uniqueData]);

  // Resize chart when container dimensions change
  useEffect(() => {
    if (chartRef.current && width && height) {
      chartRef.current.resize(width, height);
    }
  }, [width, height]);

  return (
    <div className="bg-white rounded-xl mb-4">
      <div className="p-4 flex justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {i18next.t("profile-wallet.market")}
        </div>

        <Button
          href="/market/advanced"
          target="_blank"
          appearance="gray"
          size="sm"
          icon={<UilArrowUpRight />}
        >
          {i18next.t("market-data.trade")}
        </Button>
      </div>
      <div className="px-4 pb-4">
        <div className="h-[200px]" ref={chartContainerRef} />
      </div>
    </div>
  );
}
