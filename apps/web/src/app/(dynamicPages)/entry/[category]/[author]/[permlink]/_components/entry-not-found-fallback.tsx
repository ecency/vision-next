"use client";

import { Entry } from "@/entities";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { makeEntryPath } from "@/utils";
import { getPostQueryOptions, QueryKeys } from "@ecency/sdk";
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

// Verification phase: 3 actual query completions before showing deleted
const VERIFY_MAX_POLLS = 3;

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

  // For non-optimistic entries: verification polling before concluding deleted
  const [verifyPollCount, setVerifyPollCount] = useState(0);
  const isVerifying = !isOptimistic && !hasTransitioned && verifyPollCount < VERIFY_MAX_POLLS;

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
  const { data: polledEntry, dataUpdatedAt, isError, errorUpdatedAt } = useQuery({
    ...getPostQueryOptions(username, permlink),
    queryKey: ["entry-chain-poll", username, permlink],
    enabled: (!!isOptimistic && !hasTransitioned) || isVerifying,
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

  // Track verification poll count based on actual query completions (success or error)
  const prevUpdatedAt = useRef({ data: dataUpdatedAt, error: errorUpdatedAt });
  useEffect(() => {
    if (!isOptimistic && isVerifying) {
      const dataChanged = dataUpdatedAt > 0 && dataUpdatedAt !== prevUpdatedAt.current.data;
      const errorChanged = errorUpdatedAt > 0 && errorUpdatedAt !== prevUpdatedAt.current.error;
      if (dataChanged || errorChanged) {
        prevUpdatedAt.current = { data: dataUpdatedAt, error: errorUpdatedAt };
        setVerifyPollCount((c) => c + 1);
      }
    }
  }, [isOptimistic, isVerifying, dataUpdatedAt, errorUpdatedAt]);

  // Timeout after 30s (optimistic path)
  useEffect(() => {
    if (!isOptimistic) return;
    const timer = setTimeout(() => setIsTimedOut(true), POLL_TIMEOUT);
    return () => clearTimeout(timer);
  }, [isOptimistic]);

  // Non-optimistic: still verifying — show minimal loading
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-500 dark:text-gray-400 animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  // Non-optimistic: query errored (network/RPC failure) — show retry prompt
  // instead of incorrectly showing deleted post
  if (!isOptimistic && isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="text-gray-500 dark:text-gray-400">
          Unable to load this post. Please check your connection and try again.
        </div>
        <button
          className="px-4 py-2 rounded bg-blue-dark-sky text-white hover:opacity-90"
          onClick={() => {
            setVerifyPollCount(0);
            router.refresh();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // No optimistic data and verification exhausted — genuinely deleted post
  if (!isOptimistic) {
    return <DeletedPostScreen username={username} permlink={permlink} />;
  }

  return <EntryPendingIndexView entry={optimisticEntry} isTimedOut={isTimedOut} />;
}
