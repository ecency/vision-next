import { CONFIG, getBoundFetch, QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { QuestsResponse } from "../types";

/**
 * Read-only daily/weekly/monthly quest progress for a user. Aggregates the existing
 * points ledger (no auth required — same sensitivity as `/private-api/points`).
 */
export function getQuestsQueryOptions(username: string | undefined) {
  return queryOptions({
    queryKey: QueryKeys.quests.status(username),
    enabled: !!username,
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK][Quests] – username wasn't provided");
      }

      const name = username.replace("@", "");
      const fetchApi = getBoundFetch();
      const response = await fetchApi(CONFIG.privateApiHost + "/private-api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch quests: ${response.status}`);
      }

      return (await response.json()) as QuestsResponse;
    },
    staleTime: 30000,
    refetchOnMount: true,
  });
}
