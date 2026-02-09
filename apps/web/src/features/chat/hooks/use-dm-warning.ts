import { useCallback, useEffect, useState } from "react";
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
    if (showDmWarning && sendMutationSuccess) {
      setShowDmWarning(false);
    }
  }, [showDmWarning, sendMutationSuccess]);

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
