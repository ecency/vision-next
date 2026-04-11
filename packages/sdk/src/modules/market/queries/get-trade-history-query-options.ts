import { queryOptions } from "@tanstack/react-query";
import { OrdersDataItem } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

function formatDate(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "");
}

export function getTradeHistoryQueryOptions(
  limit = 1000,
  startDate?: Date,
  endDate?: Date
) {
  const end = endDate ?? new Date();
  const start =
    startDate ?? new Date(end.getTime() - 10 * 60 * 60 * 1000);

  return queryOptions({
    queryKey: ["market", "trade-history", limit, start.getTime(), end.getTime()],
    queryFn: () =>
      callRPC("condenser_api.get_trade_history", [
        formatDate(start),
        formatDate(end),
        limit,
      ]) as Promise<OrdersDataItem[]>,
  });
}
