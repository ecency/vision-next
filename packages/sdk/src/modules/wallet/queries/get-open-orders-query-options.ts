import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { OpenOrdersData } from "../types";

/**
 * Get open market orders for an account
 *
 * @param user - The account username
 */
export function getOpenOrdersQueryOptions(user: string) {
  return queryOptions({
    queryKey: ["wallet", "open-orders", user],
    queryFn: () =>
      CONFIG.hiveClient.call("condenser_api", "get_open_orders", [
        user,
      ]) as Promise<OpenOrdersData[]>,
    select: (data) => data.sort((a, b) => a.orderid - b.orderid),
    enabled: !!user,
  });
}
