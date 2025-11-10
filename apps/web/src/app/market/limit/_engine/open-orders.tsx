import React from "react";
import { HiveEngineOpenOrder } from "@/entities";
import { Table, Td, Th, Tr } from "@ui/table";
import { Button } from "@ui/button";
import { formattedNumber, dateToFullRelative } from "@/utils";
import { Skeleton } from "@/features/shared";
import i18next from "i18next";

interface Props {
  orders: HiveEngineOpenOrder[];
  loading: boolean;
  symbol: string;
  onCancel: (order: HiveEngineOpenOrder) => void;
}

export const EngineOpenOrders = ({ orders, loading, symbol, onCancel }: Props) => {
  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!orders.length) {
    return (
      <div className="rounded border border-border-default p-4 text-sm text-text-muted">
        {i18next.t("market.engine.no-open-orders")}
      </div>
    );
  }

  return (
    <Table full={true} rounded>
      <thead>
        <Tr>
          <Th>{i18next.t("market.engine.time")}</Th>
          <Th>{i18next.t("market.engine.type")}</Th>
          <Th>{i18next.t("market.engine.price")}</Th>
          <Th>{i18next.t("market.engine.amount", { symbol })}</Th>
          <Th>{i18next.t("market.engine.total")}</Th>
          <Th>{i18next.t("market.action")}</Th>
        </Tr>
      </thead>
      <tbody>
        {orders.map((order) => {
          const timestamp = new Date(order.timestamp * 1000);
          return (
            <Tr key={`${order.id}-${order.type}`}>
              <Td>{dateToFullRelative(timestamp)}</Td>
              <Td className={order.type === "buy" ? "text-green" : "text-red"}>
                {order.type === "buy" ? i18next.t("market.buy") : i18next.t("market.sell")}
              </Td>
              <Td>{formattedNumber(order.price)}</Td>
              <Td>
                {formattedNumber(order.quantity)} {symbol}
              </Td>
              <Td>{formattedNumber(order.total)} SWAP.HIVE</Td>
              <Td>
                <Button size="sm" variant="secondary" onClick={() => onCancel(order)}>
                  {i18next.t("g.cancel")}
                </Button>
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
};
