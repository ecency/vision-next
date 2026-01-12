import React from "react";
import { HiveEngineTradeHistoryEntry } from "@/entities";
import { Table, Td, Th, Tr } from "@ui/table";
import { formattedNumber, dateToFullRelative } from "@/utils";
import { Skeleton } from "@/features/shared";
import i18next from "i18next";
import Decimal from "decimal.js";

interface Props {
  trades: HiveEngineTradeHistoryEntry[];
  loading: boolean;
  symbol: string;
}

export const EngineTradeHistory = ({ trades, loading, symbol }: Props) => {
  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold uppercase">{i18next.t("market.engine.recent-trades")}</h4>
      <Table full={true} rounded>
        <thead>
          <Tr>
            <Th>{i18next.t("market.engine.time")}</Th>
            <Th>{i18next.t("market.engine.type")}</Th>
            <Th>{i18next.t("market.engine.price")}</Th>
            <Th>{i18next.t("market.engine.amount", { symbol })}</Th>
            <Th>{i18next.t("market.engine.total")}</Th>
          </Tr>
        </thead>
        <tbody>
          {trades.slice(0, 30).map((trade) => {
            const timestamp = new Date(trade.timestamp * 1000);
            const total = new Decimal(trade.price || 0).mul(new Decimal(trade.quantity || 0)).toFixed(8);
            return (
              <Tr key={trade._id}>
                <Td>{dateToFullRelative(timestamp)}</Td>
                <Td className={trade.type === "buy" ? "text-green" : "text-red"}>
                  {trade.type === "buy" ? i18next.t("market.buy") : i18next.t("market.sell")}
                </Td>
                <Td>{formattedNumber(trade.price)}</Td>
                <Td>
                  {formattedNumber(trade.quantity)} {symbol}
                </Td>
                <Td>{formattedNumber(total)} SWAP.HIVE</Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};
