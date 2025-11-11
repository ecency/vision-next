import { MarketAdvancedModeWidget } from "./market-advanced-mode-widget";
import React, { useEffect, useState } from "react";
import dayjs, { Dayjs } from "@/utils/dayjs";
import { AutoSizer, List } from "react-virtualized";
import { MarketAsset } from "@/api/market-pair";
import { OrdersData } from "@/entities";
import { Widget } from "@/app/market/advanced/_advanced-mode/types/layout.type";
import i18next from "i18next";

interface Props {
  fromAsset: MarketAsset;
  toAsset: MarketAsset;
  history: OrdersData | null;
  onItemClick: (value: number) => void;
  widgetTypeChanged: (type: Widget) => void;
}

interface Item {
  amount: number;
  price: number;
  action: "sell" | "buy";
  date: Dayjs;
}

export const HistoryWidget = ({
  history,
  fromAsset,
  toAsset,
  onItemClick,
  widgetTypeChanged
}: Props) => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!history) return;

    const newItems: Item[] = [];
    history.asks.forEach((ask) =>
      newItems.push({
        amount: ask.hive / 1000,
        price: ask.hbd / 1000,
        action: "sell",
        date: dayjs(ask.created)
      })
    );
    history.bids.forEach((bid) =>
      newItems.push({
        amount: bid.hive / 1000,
        price: bid.hbd / 1000,
        action: "buy",
        date: dayjs(bid.created)
      })
    );

    newItems.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
    setItems(newItems);
  }, [history]);

  const getDate = (date: Dayjs) => {
    const now = dayjs();
    const isSameDay = now.isSame(date, "day");
    const isSameMonth = now.isSame(date, "month");
    const isSameYear = now.isSame(date, "year");

    if (isSameDay && isSameMonth && isSameYear) {
      return date.format("HH:mm:ss");
    } else if (isSameYear) {
      return date.format("DD MMM");
    } else {
      return date.format("DD.MM.YYYY");
    }
  };

  return (
    <MarketAdvancedModeWidget
      className="market-advanced-mode-history-widget"
      type={Widget.History}
      title={i18next.t("market.advanced.history")}
      widgetTypeChanged={widgetTypeChanged}
    >
      <div className="history-widget-content">
        <div className="history-widget-row history-widget-header">
          <div>
            {i18next.t("market.advanced.history-widget.price")}({toAsset})
          </div>
          <div>
            {i18next.t("market.advanced.history-widget.amount")}({fromAsset})
          </div>
          <div>{i18next.t("market.advanced.history-widget.time")}</div>
        </div>
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              rowCount={items.length}
              rowHeight={19}
              rowRenderer={({ key, index, style }) => (
                <div
                  className="history-widget-row selectable"
                  style={style}
                  key={key}
                  onClick={() => onItemClick(items[index].price / items[index].amount)}
                >
                  <div className={items[index].action === "buy" ? "text-green" : "text-red"}>
                    {(items[index].price / items[index].amount).toFixed(5)}
                  </div>
                  <div>{items[index].amount}</div>
                  <div>{getDate(items[index].date)}</div>
                </div>
              )}
            />
          )}
        </AutoSizer>
      </div>
    </MarketAdvancedModeWidget>
  );
};
