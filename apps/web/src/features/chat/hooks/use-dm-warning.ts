import { useCallback, useEffect, useRef, useState } from "react";
import * as ls from "@/utils/local-storage";
import type { MattermostPost } from "../mattermost-api";

interface UseDmWarningParams {
  channelId: string;
  channelData?: {
    channel?: { type?: string };
    member?: { user_id?: string };
  };
  posts: MattermostPost[];
  hasNextPage: boolean;
  sendMutationSuccess: boolean;
}

export function useDmWarning({
  channelId,
  channelData,
  posts,
  hasNextPage,
  sendMutationSuccess
}: UseDmWarningParams) {
  const [showDmWarning, setShowDmWarning] = useState(false);
  const successChannelRef = useRef<string | null>(null);

  // Track which channel the send success belongs to
  useEffect(() => {
    if (sendMutationSuccess) {
      successChannelRef.current = channelId;
    }
  }, [sendMutationSuccess, channelId]);

  // Reset tracked success on channel change
  useEffect(() => {
    successChannelRef.current = null;
  }, [channelId]);

  useEffect(() => {
    const isDm = channelData?.channel?.type === "D";
    if (!isDm || !channelId || !channelData?.member?.user_id) {
      setShowDmWarning(false);
      return;
    }

    const currentUserId = channelData.member.user_id;
    const storageKey = `dm-warning-dismissed-${currentUserId}-${channelId}`;

    if (ls.get(storageKey) === true) {
      setShowDmWarning(false);
      return;
    }

    if (hasNextPage) {
      setShowDmWarning(false);
      return;
    }

    const userHasReplied = posts.some((post) => {
      const isSystem = typeof post.type === "string" && post.type.startsWith("system");
      return post.user_id === currentUserId && !isSystem;
    });

    setShowDmWarning(!userHasReplied);
  }, [channelId, channelData?.channel?.type, channelData?.member?.user_id, hasNextPage, posts]);

  useEffect(() => {
    if (showDmWarning && sendMutationSuccess && successChannelRef.current === channelId) {
      setShowDmWarning(false);
    }
  }, [showDmWarning, sendMutationSuccess, channelId]);

  const handleDismissDmWarning = useCallback(() => {
    const currentUserId = channelData?.member?.user_id;
    if (channelId && currentUserId) {
      ls.set(`dm-warning-dismissed-${currentUserId}-${channelId}`, true);
    }
    setShowDmWarning(false);
  }, [channelId, channelData?.member?.user_id]);

  return {
    showDmWarning,
    handleDismissDmWarning
  };
}
