import { CONFIG, QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { Entry, Vote } from "../types";

export function getEntryActiveVotesQueryOptions(entry?: Entry) {
  return queryOptions({
    queryKey: QueryKeys.posts.entryActiveVotes(entry?.author, entry?.permlink),
    queryFn: async () => {
      return CONFIG.hiveClient.database.call("get_active_votes", [
        entry?.author,
        entry?.permlink,
      ]) as Promise<Vote[]>;
    },
    enabled: !!entry,
  });
}
