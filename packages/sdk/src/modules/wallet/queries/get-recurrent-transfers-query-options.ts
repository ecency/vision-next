import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { RecurrentTransfer } from "../types";

/**
 * Get recurrent transfers for an account
 *
 * @param username - The account username
 */
export function getRecurrentTransfersQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["wallet", "recurrent-transfers", username],
    queryFn: () =>
      CONFIG.hiveClient.call("condenser_api", "find_recurrent_transfers", [
        username,
      ]) as Promise<RecurrentTransfer[]>,
    enabled: !!username,
  });
}
