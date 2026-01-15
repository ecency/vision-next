import { CONFIG } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { Entry, Vote } from "../types";

export function getEntryActiveVotesQueryOptions(entry?: Entry) {
  return queryOptions({
    queryKey: ["posts", "entry-active-votes", entry?.author, entry?.permlink],
    queryFn: async () => {
      return CONFIG.hiveClient.database.call("get_active_votes", [
        entry?.author,
        entry?.permlink,
      ]) as Promise<Vote[]>;
    },
    enabled: !!entry,
  });
}
