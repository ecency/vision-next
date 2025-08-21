import React, { useMemo } from "react";
import * as Highcharts from "highcharts";
import { HighchartsReact } from "highcharts-react-official";
import "./_index.scss";
import { useGlobalStore } from "@/core/global-store";
import { getHiveEngineMarketDataQuery } from "@/api/queries";
import { Theme } from "@/enums";
import i18next from "i18next";
import dayjs from "@/utils/dayjs";

interface Props {
  symbol: string;
}

export const HiveEngineChart = ({ symbol }: Props) => {
  const theme = useGlobalStore((s) => s.theme);

  const { data } = getHiveEngineMarketDataQuery(symbol).useClientQuery();
  const prices = useMemo(() => data?.map((token: any) => +token.close) ?? [], [data]);

  const config: any = useMemo<Highcharts.Options>(
    () => ({
      title: {
        text: ""
      },
      credits: { enabled: false },
      legend: {
        enabled: false
      },
      chart: {
        height: "70",
        width: "400",
        zoomType: "x",
        backgroundColor: "transparent",
        border: "none",
        style: {
          fontFamily: "inherit",
          border: "none"
        },
        plotBorderColor: "transparent",
        plotBorderWidth: 0,
        plotBackgroundColor: "transparent",
        plotShadow: false,
        type: "area",
        spacingBottom: 0,
        spacingTop: 0,
        spacingLeft: 0,
        spacingRight: 0,
        marginTop: 0,
        marginBottom: 0
      },
      plotOptions: {
        area: {
          fillColor: theme === Theme.night ? "#2e3d51" : "#f3f7fb",
          lineColor: "transparent",
          lineWidth: 399
        },
        series: {
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: false
              }
            }
          }
        }
      },
      tooltip: {
        valueDecimals: 2,
        useHTML: true,
        shadow: false,
        formatter: ({ chart }: any) => {
          const timestamp =
            data?.[chart.hoverPoint?.index ?? 0]?.timestamp ?? 0;
          const time = dayjs(timestamp * 1000).format("DD/MM/YYYY HH:mm");
          return `
            <div>
              <div>
                ${i18next.t("g.when")}: <b>${time}</b>
              </div>
              <div>
                ${i18next.t("g.price")}:<b>${chart.hoverPoint.options.y?.toFixed(6)}</b>
              </div>
            </div>
        `;
        },
        enabled: true
      },
      xAxis: {
        lineWidth: 0,
        minorGridLineWidth: 0,
        lineColor: "transparent",
        // categories: timeStamp,
        labels: {
          enabled: false,
          style: {
            color: "red"
          }
        },
        title: {
          text: null
        },
        minorTickLength: 0,
        tickLength: 0,
        grid: {
          enabled: false
        },
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
          name: "tokens",
          data: prices.length === 0 ? [0, 0] : prices,
          type: "line",
          enableMouseTracking: true
        }
      ]
    }),
    [prices, theme]
  );

  return (
    <div className="market-graph flex justify-center ml-5">
      <HighchartsReact highcharts={Highcharts} options={config} />
    </div>
  );
};
