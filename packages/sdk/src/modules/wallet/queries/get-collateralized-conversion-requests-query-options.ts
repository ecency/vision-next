import { queryOptions } from "@tanstack/react-query";
import { CollateralizedConversionRequest } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

/**
 * Get collateralized HIVE to HBD conversion requests for an account
 *
 * @param account - The account username
 */
export function getCollateralizedConversionRequestsQueryOptions(account: string) {
  return queryOptions({
    queryKey: ["wallet", "collateralized-conversion-requests", account],
    queryFn: () =>
      callRPC("condenser_api.get_collateralized_conversion_requests", [
        account,
      ]) as Promise<CollateralizedConversionRequest[]>,
    select: (data) => data.sort((a, b) => a.requestid - b.requestid),
  });
}
