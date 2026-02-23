import dayjs from "@/utils/dayjs";
import React, { useMemo } from "react";
import numeral from "numeral";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Theme } from "@/enums";
import { useGlobalStore } from "@/core/global-store";
import { getMarketDataQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";

interface Price {
  time: number;
  price: number;
}

interface Props {
  label: string;
  coin: string;
  vsCurrency: string;
  fromTs: string;
  toTs: string;
  formatter: string;
}

export function Market({ label, formatter, coin, vsCurrency, fromTs, toTs }: Props) {
  const theme = useGlobalStore((s) => s.theme);

  const { data } = useQuery(getMarketDataQueryOptions(coin, vsCurrency, fromTs, toTs));
  const prices = useMemo(
    () => (data?.prices?.map((x: any) => ({ time: x[0], price: x[1] })) as Price[]) ?? [],
    [data]
  );

  let strPrice = "...";
  if (prices.length) {
    const price = prices[prices.length - 1].price;
    strPrice = numeral(price).format(formatter);
  }

  const config = useMemo<any>(() => ({
    title: {
      text: null
    },
    credits: { enabled: false },
    legend: {
      enabled: false
    },
    chart: {
      height: 140,
      zoomType: "x",
      backgroundColor: theme === Theme.night ? "#161d26" : ""
    },
    plotOptions: {
      area: {
        fillColor: theme === Theme.night ? "#2e3d51" : "#f3f7fb",
        lineColor: "#81acef",
        lineWidth: 3
      }
    },
    tooltip: {
      valueDecimals: 2,
      useHTML: true,
      shadow: false,
      formatter: (({ chart }: any) => {
        let date = dayjs(chart.hoverPoint.options.x).calendar();
        let rate = chart.hoverPoint.options.y;
        return `<div><div>${i18next.t("g.when")}: <b>${date}</b></div><div>${i18next.t(
          "g.price"
        )}:<b>${rate.toFixed(3)}</b></div></div>`;
      }) as any,
      enabled: true
    },
    xAxis: {
      lineWidth: 0,
      minorGridLineWidth: 0,
      lineColor: "transparent",
      labels: {
        enabled: false
      },
      title: {
        text: null
      },
      minorTickLength: 0,
      tickLength: 0,
      gridLineWidth: 0
    },
    yAxis: {
      lineWidth: 0,
      minorGridLineWidth: 0,
      lineColor: "transparent",
      title: {
        text: null
      },
      labels: {
        enabled: false
      },
      minorTickLength: 0,
      tickLength: 0,
      gridLineWidth: 0
    },
    series: [
      {
        name: " ",
        data: prices.map((item) => [item.time, item.price]),
        type: "line",
        enableMouseTracking: true
      }
    ]
  }), [prices, theme]);

  return (
    <div className="market-graph">
      <div className="graph">
        <HighchartsReact highcharts={Highcharts} options={config} />
      </div>
      <div className="info">
        <div className="price">
          <span className="coin">{label}</span> <span className="value">{strPrice}</span>
        </div>
      </div>
    </div>
  );
}
