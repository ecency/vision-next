import { TradingViewQueryDataItem } from "@/app/market/advanced/_components/api";
import { useGlobalStore } from "@/core/global-store";
import { useInfiniteDataFlow } from "@/utils";
import { getHiveEngineTokensMetricsQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { createChart, IChartApi, ISeriesApi, Time, TimeRange } from "lightweight-charts";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { useMount } from "react-use";

export function HiveEngineChart() {
  const theme = useGlobalStore((s) => s.theme);

  const { token } = useParams();
  const { ref: chartContainerRef, width, height } = useResizeDetector();

  const chartRef = useRef<IChartApi>();
  const candleStickSeriesRef = useRef<ISeriesApi<"Candlestick">>();

  const { data } = useQuery({
    ...getHiveEngineTokensMetricsQueryOptions(token as string),
    select: (items) =>
      items
        .map((item) => ({
          open: +item.open,
          close: +item.close,
          high: +item.high,
          low: +item.low,
          volume: +item.quoteVolume,
          time: format(new Date(item.timestamp * 1000), "yyyy-MM-dd")
        }))
        .sort((a, b) => Number(a.time) - Number(b.time))
  });

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
    if (candleStickSeriesRef.current && data) {
      candleStickSeriesRef.current.setData([]);
      candleStickSeriesRef.current.setData([...data]);
    }
  }, [data]);

  return <div className="bg-white rounded-xl h-[300px] mb-4" ref={chartContainerRef} />;
}
