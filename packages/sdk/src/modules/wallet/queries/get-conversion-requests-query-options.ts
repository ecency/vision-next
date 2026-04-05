import { queryOptions } from "@tanstack/react-query";
import { ConversionRequest } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

/**
 * Get HBD to HIVE conversion requests for an account
 *
 * @param account - The account username
 */
export function getConversionRequestsQueryOptions(account: string) {
  return queryOptions({
    queryKey: ["wallet", "conversion-requests", account],
    queryFn: () =>
      callRPC("condenser_api.get_conversion_requests", [
        account,
      ]) as Promise<ConversionRequest[]>,
    select: (data) => data.sort((a, b) => a.requestid - b.requestid),
  });
}
