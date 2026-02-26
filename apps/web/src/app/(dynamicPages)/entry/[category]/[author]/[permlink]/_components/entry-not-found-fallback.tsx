"use client";

import { Entry } from "@/entities";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { makeEntryPath } from "@/utils";
import { getPostQueryOptions, QueryKeys } from "@ecency/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DeletedPostScreen } from "./deleted-post-screen";
import { EntryPendingIndexView } from "./entry-pending-index-view";

interface Props {
  username: string;
  permlink: string;
}

const POLL_INTERVAL = 3_000;
const POLL_TIMEOUT = 30_000;

export function EntryNotFoundFallback({ username, permlink }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Read optimistic entry from client cache on mount
  const [optimisticEntry] = useState<Entry | undefined>(() => {
    const cacheKey = QueryKeys.posts.entry(makeEntryPath("", username, permlink));
    return queryClient.getQueryData<Entry>(cacheKey);
  });

  const isOptimistic = optimisticEntry && optimisticEntry.post_id === 1;

  const [isTimedOut, setIsTimedOut] = useState(false);
  const [hasTransitioned, setHasTransitioned] = useState(false);

  const handleSuccess = useCallback(
    (realEntry: Entry) => {
      if (hasTransitioned) return;
      setHasTransitioned(true);

      // Update the main entry cache with real data
      EcencyEntriesCacheManagement.updateEntryQueryData([realEntry], queryClient);

      // Trigger full SSR re-render
      router.refresh();
    },
    [hasTransitioned, queryClient, router]
  );

  // Poll blockchain via SDK (with node failover + DMCA filtering)
  // Uses separate query key to avoid overwriting optimistic cache
  const { data: polledEntry } = useQuery({
    ...getPostQueryOptions(username, permlink),
    queryKey: ["entry-chain-poll", username, permlink],
    enabled: !!isOptimistic && !hasTransitioned,
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: false,
    retry: false
  });

  // Handle real data arrival
  useEffect(() => {
    if (polledEntry && polledEntry.post_id && polledEntry.post_id > 1) {
      handleSuccess(polledEntry);
    }
  }, [polledEntry, handleSuccess]);

  // Timeout after 30s
  useEffect(() => {
    if (!isOptimistic) return;
    const timer = setTimeout(() => setIsTimedOut(true), POLL_TIMEOUT);
    return () => clearTimeout(timer);
  }, [isOptimistic]);

  // No optimistic data — genuinely deleted post
  if (!isOptimistic) {
    return <DeletedPostScreen username={username} permlink={permlink} />;
  }

  return <EntryPendingIndexView entry={optimisticEntry} isTimedOut={isTimedOut} />;
}
