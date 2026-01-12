import { infiniteQueryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { Witness } from "../types";

type WitnessPage = Witness[];
type WitnessCursor = string;

/**
 * Get witnesses ordered by vote count (infinite scroll)
 *
 * @param limit - Number of witnesses per page
 */
export function getWitnessesInfiniteQueryOptions(limit: number) {
  return infiniteQueryOptions<WitnessPage, Error, WitnessPage, (string | number)[], WitnessCursor>({
    queryKey: ["witnesses", "list", limit],
    initialPageParam: "" as WitnessCursor,

    queryFn: async ({ pageParam }: { pageParam: WitnessCursor }) =>
      CONFIG.hiveClient.call("condenser_api", "get_witnesses_by_vote", [
        pageParam,
        limit,
      ]) as Promise<Witness[]>,

    getNextPageParam: (lastPage: WitnessPage): WitnessCursor | undefined => {
      const last = lastPage?.[lastPage.length - 1];
      return last ? last.owner : undefined;
    },
  });
}
