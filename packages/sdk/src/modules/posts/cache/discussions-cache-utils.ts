import { getQueryClient, QueryKeys } from "@/modules/core";
import type { Entry } from "../types";
import type { QueryClient } from "@tanstack/react-query";

/**
 * Adds an optimistic entry to all discussions caches for the given root post.
 * Uses predicate matching to find all sort order variants.
 */
export function addOptimisticDiscussionEntry(
  entry: Entry,
  rootAuthor: string,
  rootPermlink: string,
  qc?: QueryClient
) {
  const queryClient = qc ?? getQueryClient();
  const queries = queryClient.getQueriesData<Entry[]>({
    predicate: (query) => {
      const key = query.queryKey;
      return (
        Array.isArray(key) &&
        key[0] === "posts" &&
        key[1] === "discussions" &&
        key[2] === rootAuthor &&
        key[3] === rootPermlink
      );
    },
  });

  for (const [queryKey, data] of queries) {
    if (data) {
      queryClient.setQueryData<Entry[]>(queryKey, [entry, ...data]);
    }
  }
}

/**
 * Removes an entry from all discussions caches for the given root post.
 * Returns the previous state for rollback.
 */
export function removeOptimisticDiscussionEntry(
  author: string,
  permlink: string,
  rootAuthor: string,
  rootPermlink: string,
  qc?: QueryClient
): Map<readonly unknown[], Entry[]> {
  const queryClient = qc ?? getQueryClient();
  const snapshots = new Map<readonly unknown[], Entry[]>();

  const queries = queryClient.getQueriesData<Entry[]>({
    predicate: (query) => {
      const key = query.queryKey;
      return (
        Array.isArray(key) &&
        key[0] === "posts" &&
        key[1] === "discussions" &&
        key[2] === rootAuthor &&
        key[3] === rootPermlink
      );
    },
  });

  for (const [queryKey, data] of queries) {
    if (data) {
      snapshots.set(queryKey, data);
      queryClient.setQueryData<Entry[]>(
        queryKey,
        data.filter(
          (e) => e.author !== author || e.permlink !== permlink
        )
      );
    }
  }

  return snapshots;
}

/**
 * Restores discussion cache snapshots (for rollback on error).
 */
export function restoreDiscussionSnapshots(
  snapshots: Map<readonly unknown[], Entry[]>,
  qc?: QueryClient
) {
  const queryClient = qc ?? getQueryClient();
  for (const [queryKey, data] of snapshots) {
    queryClient.setQueryData<Entry[]>(queryKey, data);
  }
}

/**
 * Updates a specific entry in the SDK entry cache.
 * Returns the previous entry for rollback.
 */
export function updateEntryInCache(
  author: string,
  permlink: string,
  updates: Partial<Entry>,
  qc?: QueryClient
): Entry | undefined {
  const queryClient = qc ?? getQueryClient();
  const path = `/@${author}/${permlink}`;
  const previous = queryClient.getQueryData<Entry>(QueryKeys.posts.entry(path));

  if (previous) {
    queryClient.setQueryData<Entry>(QueryKeys.posts.entry(path), {
      ...previous,
      ...updates,
    });
  }

  return previous;
}

/**
 * Restores an entry in cache (for rollback on error).
 */
export function restoreEntryInCache(
  author: string,
  permlink: string,
  entry: Entry,
  qc?: QueryClient
) {
  const queryClient = qc ?? getQueryClient();
  const path = `/@${author}/${permlink}`;
  queryClient.setQueryData<Entry>(QueryKeys.posts.entry(path), entry);
}
