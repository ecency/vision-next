import { useEffect, useRef } from "react";
import type { MattermostPostsResponse } from "../mattermost-api";
import type { InfiniteData } from "@tanstack/react-query";

interface UseDeepLinkingParams {
  channelId: string;
  focusedPostId: string | null;
  data: InfiniteData<MattermostPostsResponse> | undefined;
  isLoading: boolean;
  aroundQuery: {
    data: any;
    isLoading: boolean;
    error: Error | null;
  };
  scrollToPost: (postId: string, options?: { highlight?: boolean; behavior?: ScrollBehavior }) => void;
  setNeedsAroundFetch: (v: boolean) => void;
  setShowJoinPrompt: (v: boolean) => void;
}

export function useDeepLinking({
  channelId,
  focusedPostId,
  data,
  isLoading,
  aroundQuery,
  scrollToPost,
  setNeedsAroundFetch,
  setShowJoinPrompt
}: UseDeepLinkingParams) {
  const hasFocusedPostRef = useRef(false);

  // Ref bridge: always points to the latest scrollToPost without changing identity
  const scrollToPostRef = useRef(scrollToPost);
  scrollToPostRef.current = scrollToPost;

  // Ref bridge for setters
  const setNeedsAroundFetchRef = useRef(setNeedsAroundFetch);
  setNeedsAroundFetchRef.current = setNeedsAroundFetch;
  const setShowJoinPromptRef = useRef(setShowJoinPrompt);
  setShowJoinPromptRef.current = setShowJoinPrompt;

  // Reset on channel change
  useEffect(() => {
    hasFocusedPostRef.current = false;
  }, [channelId]);

  // Reset on focusedPostId change
  useEffect(() => {
    hasFocusedPostRef.current = false;
  }, [focusedPostId]);

  // Enhanced deep linking with around-based loading
  useEffect(() => {
    if (!focusedPostId || hasFocusedPostRef.current) return;
    if (isLoading) return;

    const allPosts = data?.pages?.flatMap(page => page?.posts || []) || [];
    const postInView = allPosts.some(post => post.id === focusedPostId);

    if (postInView) {
      hasFocusedPostRef.current = true;
      requestAnimationFrame(() =>
        scrollToPostRef.current(focusedPostId, { highlight: true, behavior: "smooth" })
      );
    } else if (!aroundQuery.data && !aroundQuery.isLoading) {
      setNeedsAroundFetchRef.current(true);
    }
  }, [focusedPostId, data, isLoading, aroundQuery.data, aroundQuery.isLoading]);

  // Handle around query results
  useEffect(() => {
    if (!aroundQuery.data || !focusedPostId) return;

    const timer = setTimeout(() => {
      scrollToPostRef.current(focusedPostId, { highlight: true, behavior: "smooth" });
      hasFocusedPostRef.current = true;
      setNeedsAroundFetchRef.current(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [aroundQuery.data, focusedPostId]);

  // Handle around query errors (e.g., not a member)
  useEffect(() => {
    if (!aroundQuery.error || !focusedPostId) return;

    const errorMessage = (aroundQuery.error as Error)?.message?.toLowerCase() || '';
    const isMembershipError =
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('403') ||
      errorMessage.includes('404') ||
      errorMessage.includes('no channel member');

    if (isMembershipError) {
      setShowJoinPromptRef.current(true);
      setNeedsAroundFetchRef.current(false);
    }
  }, [aroundQuery.error, focusedPostId]);

  return { hasFocusedPostRef };
}
