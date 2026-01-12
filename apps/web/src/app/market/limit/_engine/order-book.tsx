import React from "react";
import { HiveEngineOrderBookEntry } from "@/entities";
import { Table, Td, Th, Tr } from "@ui/table";
import { formattedNumber } from "@/utils";
import { Skeleton } from "@/features/shared";
import Decimal from "decimal.js";
import i18next from "i18next";

interface Props {
  buy: HiveEngineOrderBookEntry[];
  sell: HiveEngineOrderBookEntry[];
  loading: boolean;
  symbol: string;
  onSelectPrice?: (price: string, type: "buy" | "sell") => void;
}

const renderTotal = (order: HiveEngineOrderBookEntry) => {
  if (order.tokensLocked) {
    return formattedNumber(order.tokensLocked);
  }

  return formattedNumber(new Decimal(order.price || 0).mul(new Decimal(order.quantity || 0)).toFixed(8));
};

export const EngineOrderBook = ({ buy, sell, loading, symbol, onSelectPrice }: Props) => {
  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const renderRow = (order: HiveEngineOrderBookEntry, type: "buy" | "sell") => (
    <Tr
      key={`${order.txId}-${type}`}
      className="cursor-pointer hover:bg-background-hover"
      onClick={() => onSelectPrice?.(order.price, type)}
    >
      <Td>{formattedNumber(order.price)}</Td>
      <Td>
        {formattedNumber(order.quantity)} {symbol}
      </Td>
      <Td>{renderTotal(order)} SWAP.HIVE</Td>
    </Tr>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase text-green">
          {i18next.t("market.engine.bids")}
        </h4>
        <Table full={true} rounded>
          <thead>
            <Tr>
              <Th>{i18next.t("market.engine.price")}</Th>
              <Th>{i18next.t("market.engine.amount", { symbol })}</Th>
              <Th>{i18next.t("market.engine.total")}</Th>
            </Tr>
          </thead>
          <tbody>{buy.slice(0, 20).map((order) => renderRow(order, "buy"))}</tbody>
        </Table>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase text-red">
          {i18next.t("market.engine.asks")}
        </h4>
        <Table full={true} rounded>
          <thead>
            <Tr>
              <Th>{i18next.t("market.engine.price")}</Th>
              <Th>{i18next.t("market.engine.amount", { symbol })}</Th>
              <Th>{i18next.t("market.engine.total")}</Th>
            </Tr>
          </thead>
          <tbody>{sell.slice(0, 20).map((order) => renderRow(order, "sell"))}</tbody>
        </Table>
      </div>
    </div>
  );
};
