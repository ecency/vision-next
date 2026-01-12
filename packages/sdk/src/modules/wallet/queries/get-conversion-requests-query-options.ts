import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { ConversionRequest } from "../types";

/**
 * Get HBD to HIVE conversion requests for an account
 *
 * @param account - The account username
 */
export function getConversionRequestsQueryOptions(account: string) {
  return queryOptions({
    queryKey: ["wallet", "conversion-requests", account],
    queryFn: () =>
      CONFIG.hiveClient.database.call("get_conversion_requests", [
        account,
      ]) as Promise<ConversionRequest[]>,
    select: (data) => data.sort((a, b) => a.requestid - b.requestid),
  });
}
