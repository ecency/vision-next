import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { OrdersData } from "../types";

/**
 * Get the internal HIVE/HBD market order book
 *
 * @param limit - Maximum number of orders to fetch (default: 500)
 */
export function getOrderBookQueryOptions(limit = 500) {
  return queryOptions({
    queryKey: ["market", "order-book", limit],
    queryFn: () =>
      CONFIG.hiveClient.call("condenser_api", "get_order_book", [
        limit,
      ]) as Promise<OrdersData>,
  });
}
