import { queryOptions } from "@tanstack/react-query";
import { OrdersData } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

/**
 * Get the internal HIVE/HBD market order book
 *
 * @param limit - Maximum number of orders to fetch (default: 500)
 */
export function getOrderBookQueryOptions(limit = 500) {
  return queryOptions({
    queryKey: ["market", "order-book", limit],
    queryFn: () =>
      callRPC("condenser_api.get_order_book", [
        limit,
      ]) as Promise<OrdersData>,
  });
}
