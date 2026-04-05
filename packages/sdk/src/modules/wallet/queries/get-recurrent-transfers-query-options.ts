import { queryOptions } from "@tanstack/react-query";
import { RecurrentTransfer } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

/**
 * Get recurrent transfers for an account
 *
 * @param username - The account username
 */
export function getRecurrentTransfersQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["wallet", "recurrent-transfers", username],
    queryFn: () =>
      callRPC("condenser_api.find_recurrent_transfers", [
        username,
      ]) as Promise<RecurrentTransfer[]>,
    enabled: !!username,
  });
}
