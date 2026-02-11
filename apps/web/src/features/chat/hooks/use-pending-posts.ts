import { useEffect, useRef } from "react";
import type { UseMutationResult } from "@tanstack/react-query";

export function usePendingPosts(sendMutation: UseMutationResult<any, any, any, any>) {
  const lastSentPendingIdRef = useRef<string | null>(null);
  const lastSentMessageRef = useRef<string | null>(null);
  const lastSentRootIdRef = useRef<string | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const confirmedPendingPostIdsRef = useRef<Set<string>>(new Set());
  const pendingAbortControllerRef = useRef<AbortController | null>(null);
  const sendMutationRef = useRef(sendMutation);

  useEffect(() => {
    sendMutationRef.current = sendMutation;
  }, [sendMutation]);

  return {
    lastSentPendingIdRef,
    lastSentMessageRef,
    lastSentRootIdRef,
    lastSentAtRef,
    confirmedPendingPostIdsRef,
    pendingAbortControllerRef,
    sendMutationRef
  };
}
