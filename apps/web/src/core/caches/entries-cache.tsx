import { getQueryClient, QueryIdentifiers } from "../react-query";
import * as bridgeApi from "../../api/bridge";
import { Entry, EntryVote } from "@/entities";
import { makeEntryPath } from "@/utils";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import dmcaPosts from "../../../public/dmca/dmca-posts.json";

export namespace EcencyEntriesCacheManagement {
  export function getEntryQueryByPath(author?: string, permlink?: string) {
    return {
      queryKey: [
        QueryIdentifiers.ENTRY,
        author && permlink ? makeEntryPath("", author!!, permlink!!) : "EMPTY"
      ],
      queryFn: () => bridgeApi.getPost(author, permlink),
      enabled: typeof author === "string" && typeof permlink === "string" && !!author && !!permlink
    };
  }

  export function getEntryQuery<T extends Entry>(initialEntry?: T) {
    return {
      queryKey: [
        QueryIdentifiers.ENTRY,
        initialEntry ? makeEntryPath("", initialEntry.author, initialEntry.permlink) : "EMPTY"
      ],
      queryFn: () => bridgeApi.getPost(initialEntry?.author, initialEntry?.permlink) as Promise<T>,
      initialData: initialEntry,
      enabled: !!initialEntry
    };
  }

  export function getNormalizedPostQuery<T extends Entry>(entry?: T) {
    return {
      queryKey: [
        QueryIdentifiers.NORMALIZED_ENTRY,
        entry ? makeEntryPath("", entry.author, entry.permlink) : "EMPTY"
      ],
      queryFn: () => bridgeApi.normalizePost(entry),
      enabled: !!entry
    };
  }

  export function useAddReply(initialEntry?: Entry) {
    const qc = useQueryClient();

    return {
      addReply: (reply: Entry, entry = initialEntry) =>
        mutateEntryInstance(
          entry,
          (value) => ({
            ...value,
            children: value.children + 1,
            replies: [reply, ...value.replies]
          }),
          qc
        )
    };
  }

  export function useUpdateRepliesCount(initialEntry?: Entry) {
    const qc = useQueryClient();

    return {
      updateRepliesCount: (count: number, entry = initialEntry) =>
        mutateEntryInstance(
          entry,
          (value) => ({
            ...value,
            children: count
          }),
          qc
        )
    };
  }

  export function useInvalidation(entry?: Entry) {
    const qc = useQueryClient();
    return {
      invalidate: () =>
        qc.invalidateQueries({
          queryKey: [
            QueryIdentifiers.ENTRY,
            makeEntryPath("", entry?.author ?? "", entry?.permlink ?? "")
          ]
        })
    };
  }

  export function useUpdateVotes(entry?: Entry) {
    const qc = useQueryClient();
    return {
      update: (votes: EntryVote[], payout: number) =>
        entry &&
        mutateEntryInstance(
          entry,
          (value) => ({
            ...value,
            active_votes: votes,
            stats: {
              ...entry.stats || { gray: false, hide: false, flag_weight: 0, total_votes: 0 },
              total_votes: votes.length,
              flag_weight: entry?.stats?.flag_weight || 0
            },
            total_votes: votes.length,
            payout,
            pending_payout_value: String(payout)
          }),
          qc
        )
    };
  }

  export function useUpdateEntry() {
    const qc = useQueryClient();

    const updateEntryQueryDataFn = useCallback(
      (entries: Entry[]) => updateEntryQueryData(entries, qc),
      [qc]
    );

    return {
      updateEntryQueryData: updateEntryQueryDataFn
    };
  }

  export function useUpdateReblogsCount(entry: Entry) {
    const qc = useQueryClient();
    return {
      update: (count: number) =>
        mutateEntryInstance(
          entry,
          (value) => ({
            ...value,
            reblogs: count
          }),
          qc
        )
    };
  }

  export function updateEntryQueryData(entries: Entry[], qc: QueryClient = getQueryClient()) {
    entries.forEach((entry) => {
      qc.setQueryData<Entry>(
        [QueryIdentifiers.ENTRY, makeEntryPath("", entry.author, entry.permlink)],
        () => {
          const data = { ...entry };
          const entryPath = `@${entry.author}/${entry.permlink}`;
          if (dmcaPosts.includes(entryPath)) {
            data.body = "This post is not available due to a copyright/fraudulent claim.";
            data.title = "";
          }

          return data;
        }
      );
    });
  }

  function mutateEntryInstance(
    entry: Entry | undefined,
    callback: (value: Entry) => Entry,
    qc: QueryClient = getQueryClient()
  ) {
    if (!entry) {
      throw new Error("Mutate entry instance – entry not provided");
    }

    const actualEntryValue = qc.getQueryData<Entry>([
      QueryIdentifiers.ENTRY,
      makeEntryPath("", entry.author, entry.permlink)
    ]);
    const value = callback(actualEntryValue ?? entry);
    return updateEntryQueryData([value], qc);
  }
}
