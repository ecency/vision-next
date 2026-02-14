import { getQueryClient } from "@/modules/core";
import type { Entry, EntryVote } from "../types";
import type { QueryClient } from "@tanstack/react-query";

function makeEntryPath(author: string, permlink: string) {
  return `/@${author}/${permlink}`;
}

function getEntryFromCache(
  author: string,
  permlink: string,
  qc?: QueryClient
): Entry | undefined {
  const queryClient = qc ?? getQueryClient();
  return queryClient.getQueryData<Entry>([
    "posts",
    "entry",
    makeEntryPath(author, permlink),
  ]);
}

function setEntryInCache(entry: Entry, qc?: QueryClient) {
  const queryClient = qc ?? getQueryClient();
  queryClient.setQueryData<Entry>(
    ["posts", "entry", makeEntryPath(entry.author, entry.permlink)],
    entry
  );
}

function mutateEntry(
  author: string,
  permlink: string,
  updater: (entry: Entry) => Entry,
  qc?: QueryClient
): Entry | undefined {
  const queryClient = qc ?? getQueryClient();
  const path = makeEntryPath(author, permlink);
  const existing = queryClient.getQueryData<Entry>(["posts", "entry", path]);
  if (!existing) return undefined;

  const updated = updater(existing);
  queryClient.setQueryData<Entry>(["posts", "entry", path], updated);
  return existing;
}

/**
 * SDK-level entry cache utilities. These operate on SDK cache keys
 * (["posts", "entry", "/@author/permlink"]).
 *
 * Web layer can bridge these to its own QueryIdentifiers.ENTRY keys
 * during the migration period.
 */
export namespace EntriesCacheManagement {
  export function updateVotes(
    author: string,
    permlink: string,
    votes: EntryVote[],
    payout: number,
    qc?: QueryClient
  ) {
    mutateEntry(
      author,
      permlink,
      (entry) => ({
        ...entry,
        active_votes: votes,
        stats: {
          ...(entry.stats || {
            gray: false,
            hide: false,
            flag_weight: 0,
            total_votes: 0,
          }),
          total_votes: votes.length,
          flag_weight: entry.stats?.flag_weight || 0,
        },
        total_votes: votes.length,
        payout,
        pending_payout_value: String(payout),
      }),
      qc
    );
  }

  export function updateReblogsCount(
    author: string,
    permlink: string,
    count: number,
    qc?: QueryClient
  ) {
    mutateEntry(
      author,
      permlink,
      (entry) => ({
        ...entry,
        reblogs: count,
      }),
      qc
    );
  }

  export function updateRepliesCount(
    author: string,
    permlink: string,
    count: number,
    qc?: QueryClient
  ) {
    mutateEntry(
      author,
      permlink,
      (entry) => ({
        ...entry,
        children: count,
      }),
      qc
    );
  }

  export function addReply(
    reply: Entry,
    parentAuthor: string,
    parentPermlink: string,
    qc?: QueryClient
  ) {
    mutateEntry(
      parentAuthor,
      parentPermlink,
      (entry) => ({
        ...entry,
        children: entry.children + 1,
        replies: [reply, ...entry.replies],
      }),
      qc
    );
  }

  export function updateEntries(entries: Entry[], qc?: QueryClient) {
    entries.forEach((entry) => setEntryInCache(entry, qc));
  }

  export function invalidateEntry(
    author: string,
    permlink: string,
    qc?: QueryClient
  ) {
    const queryClient = qc ?? getQueryClient();
    queryClient.invalidateQueries({
      queryKey: ["posts", "entry", makeEntryPath(author, permlink)],
    });
  }

  export function getEntry(
    author: string,
    permlink: string,
    qc?: QueryClient
  ): Entry | undefined {
    return getEntryFromCache(author, permlink, qc);
  }
}
