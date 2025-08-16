import { TradingViewQueryDataItem } from "@/app/market/advanced/_components/api";
import { useGlobalStore } from "@/core/global-store";
import { Button } from "@/features/ui";
import { useInfiniteDataFlow } from "@/utils";
import { getHiveAssetMetricQueryOptions } from "@ecency/wallets";
import { useInfiniteQuery } from "@tanstack/react-query";
import { UilArrowUpRight } from "@tooni/iconscout-unicons-react";
import { format } from "date-fns";
import i18next from "i18next";
import { createChart, IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
import { useMount } from "react-use";

export function HiveChart() {
  const theme = useGlobalStore((s) => s.theme);

  const { token } = useParams();
  const { ref: chartContainerRef, width, height } = useResizeDetector();

  const chartRef = useRef<IChartApi>();
  const candleStickSeriesRef = useRef<ISeriesApi<"Candlestick">>();

  const {
    data: dataPages,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteQuery(getHiveAssetMetricQueryOptions());

  const data = useInfiniteDataFlow(dataPages);
  const uniqueData = useMemo(
    () =>
      Array.from(
        data
          .reduce(
            (acc, item) =>
              acc.set(format(item.time, "yyyy-MM-dd"), {
                ...item,
                time: format(item.time, "yyyy-MM-dd")
              }),
            new Map<Time, TradingViewQueryDataItem>()
          )
          .values()
      ).sort((a, b) => Number(a.time) - Number(b.time)),
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
        timeVisible: true
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
      candleStickSeriesRef.current.setData(uniqueData);
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
        <div className="text-sm text-gray-600 dark:text-gray-400">Market</div>

        <Button
          href="/marked/advanced"
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
