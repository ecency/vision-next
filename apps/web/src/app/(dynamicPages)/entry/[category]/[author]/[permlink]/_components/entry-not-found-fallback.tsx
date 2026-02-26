"use client";

import { Entry } from "@/entities";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { makeEntryPath } from "@/utils";
import { QueryKeys } from "@ecency/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const hasTransitioned = useRef(false);

  const handleSuccess = useCallback(
    (realEntry: Entry) => {
      if (hasTransitioned.current) return;
      hasTransitioned.current = true;

      // Update the main entry cache with real data
      EcencyEntriesCacheManagement.updateEntryQueryData([realEntry], queryClient);

      // Trigger full SSR re-render
      router.refresh();
    },
    [queryClient, router]
  );

  // Poll blockchain with separate query key to avoid overwriting optimistic cache
  const { data: polledEntry } = useQuery<Entry | null>({
    queryKey: ["entry-chain-poll", username, permlink],
    queryFn: async () => {
      const response = await fetch(
        `https://api.hive.blog`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "bridge.get_post",
            params: { author: username, permlink, observer: "" },
            id: 1
          })
        }
      );
      const json = await response.json();
      return json.result ?? null;
    },
    enabled: !!isOptimistic && !hasTransitioned.current,
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
