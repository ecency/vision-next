import { useEffect, useRef, useState } from "react";
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
}

export function useDeepLinking({
  channelId,
  focusedPostId,
  data,
  isLoading,
  aroundQuery,
  scrollToPost
}: UseDeepLinkingParams) {
  const [needsAroundFetch, setNeedsAroundFetch] = useState(false);
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const hasFocusedPostRef = useRef(false);

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
        scrollToPost(focusedPostId, { highlight: true, behavior: "smooth" })
      );
    } else if (!aroundQuery.data && !aroundQuery.isLoading && !needsAroundFetch) {
      setNeedsAroundFetch(true);
    }
  }, [focusedPostId, data, isLoading, aroundQuery.data, aroundQuery.isLoading, needsAroundFetch, scrollToPost]);

  // Handle around query results
  useEffect(() => {
    if (!aroundQuery.data || !focusedPostId) return;

    setTimeout(() => {
      scrollToPost(focusedPostId, { highlight: true, behavior: "smooth" });
      hasFocusedPostRef.current = true;
      setNeedsAroundFetch(false);
    }, 100);
  }, [aroundQuery.data, focusedPostId, scrollToPost]);

  // Handle around query errors (e.g., not a member)
  useEffect(() => {
    if (!aroundQuery.error || !focusedPostId) return;

    const errorMessage = (aroundQuery.error as Error)?.message || '';
    const isMembershipError =
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('403') ||
      errorMessage.includes('404');

    if (isMembershipError) {
      setShowJoinPrompt(true);
      setNeedsAroundFetch(false);
    }
  }, [aroundQuery.error, focusedPostId]);

  return {
    needsAroundFetch,
    setNeedsAroundFetch,
    showJoinPrompt,
    setShowJoinPrompt,
    hasFocusedPostRef
  };
}
