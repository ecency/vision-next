import { getQueryClient, QueryIdentifiers } from "../react-query";
import {
  getNormalizePostQueryOptions,
  getPostQueryOptions,
  EntriesCacheManagement as SdkEntriesCacheManagement
} from "@ecency/sdk";
import { Entry, EntryVote } from "@/entities";
import { makeEntryPath } from "@/utils";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export namespace EcencyEntriesCacheManagement {
  export function getEntryQueryByPath(author?: string, permlink?: string) {
    return {
      ...getPostQueryOptions(author ?? "", permlink),
      queryKey: [
        QueryIdentifiers.ENTRY,
        author && permlink ? makeEntryPath("", author, permlink) : "EMPTY"
      ],
      enabled: typeof author === "string" && typeof permlink === "string" && !!author && !!permlink
    };
  }

  export function getEntryQuery<T extends Entry>(initialEntry?: T) {
    return {
      ...getPostQueryOptions(initialEntry?.author ?? "", initialEntry?.permlink),
      queryKey: [
        QueryIdentifiers.ENTRY,
        initialEntry ? makeEntryPath("", initialEntry.author, initialEntry.permlink) : "EMPTY"
      ],
      initialData: initialEntry,
      enabled: !!initialEntry
    };
  }

  export function getNormalizedPostQuery<T extends Entry>(entry?: T) {
    return {
      ...getNormalizePostQueryOptions(entry),
      queryKey: [
        QueryIdentifiers.NORMALIZED_ENTRY,
        entry ? makeEntryPath("", entry.author, entry.permlink) : "EMPTY"
      ],
      enabled: !!entry
    };
  }

  export function useAddReply(initialEntry?: Entry) {
    const qc = useQueryClient();

    return {
      addReply: (reply: Entry, entry = initialEntry) => {
        // Update web cache key
        mutateEntryInstance(
          entry,
          (value) => ({
            ...value,
            children: value.children + 1,
            replies: [reply, ...value.replies]
          }),
          qc
        );
        // Also update SDK cache key
        if (entry) {
          SdkEntriesCacheManagement.addReply(reply, entry.author, entry.permlink, qc);
        }
      }
    };
  }

  export function useUpdateRepliesCount(initialEntry?: Entry) {
    const qc = useQueryClient();

    return {
      updateRepliesCount: (count: number, entry = initialEntry) => {
        mutateEntryInstance(
          entry,
          (value) => ({
            ...value,
            children: count
          }),
          qc
        );
        if (entry) {
          SdkEntriesCacheManagement.updateRepliesCount(entry.author, entry.permlink, count, qc);
        }
      }
    };
  }

  export function useInvalidation(entry?: Entry | null) {
    const qc = useQueryClient();
    return {
      invalidate: () => {
        // Invalidate web cache key
        qc.invalidateQueries({
          queryKey: [
            QueryIdentifiers.ENTRY,
            makeEntryPath("", entry?.author ?? "", entry?.permlink ?? "")
          ]
        });
        // Also invalidate SDK cache key
        if (entry) {
          SdkEntriesCacheManagement.invalidateEntry(entry.author, entry.permlink, qc);
        }
      }
    };
  }

  export function useUpdateVotes(entry?: Entry | null) {
    const qc = useQueryClient();
    return {
      update: (votes: EntryVote[], payout: number) => {
        if (!entry) return;
        // Update web cache key
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
        );
        // Also update SDK cache key
        SdkEntriesCacheManagement.updateVotes(entry.author, entry.permlink, votes, payout, qc);
      }
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
      update: (count: number) => {
        // Update web cache key
        mutateEntryInstance(
          entry,
          (value) => ({
            ...value,
            reblogs: count
          }),
          qc
        );
        // Also update SDK cache key
        SdkEntriesCacheManagement.updateReblogsCount(entry.author, entry.permlink, count, qc);
      }
    };
  }

  export function updateEntryQueryData(entries: Entry[], qc: QueryClient = getQueryClient()) {
    entries.forEach((entry) => {
      // Update web cache key
      qc.setQueryData<Entry>(
        [QueryIdentifiers.ENTRY, makeEntryPath("", entry.author, entry.permlink)],
        () => entry
      );
    });
    // Also update SDK cache keys
    SdkEntriesCacheManagement.updateEntries(entries, qc);
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
