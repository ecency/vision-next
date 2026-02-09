import { useCallback, useMemo, useState } from "react";
import {
  type MattermostPost,
  type MattermostPostsResponse,
  useMattermostDeletePost,
  useMattermostReactToPost,
  useMattermostPinnedPosts,
  useMattermostPinPost,
  useMattermostUnpinPost
} from "../mattermost-api";
import { toMattermostEmojiName } from "../emoji-utils";

interface UsePostActionsParams {
  channelId: string;
  channelData: MattermostPostsResponse | undefined;
}

export function usePostActions({ channelId, channelData }: UsePostActionsParams) {
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [openReactionPostId, setOpenReactionPostId] = useState<string | null>(null);
  const [showPinnedModal, setShowPinnedModal] = useState(false);

  const deleteMutation = useMattermostDeletePost(channelId);
  const reactMutation = useMattermostReactToPost(channelId);
  const pinnedPostsQuery = useMattermostPinnedPosts(channelId);
  const pinPostMutation = useMattermostPinPost(channelId);
  const unpinPostMutation = useMattermostUnpinPost(channelId);

  const canPin = useMemo(() => {
    const channelType = channelData?.channel?.type;
    const isModerator = channelData?.canModerate;
    const isMember = !!channelData?.member;

    if (channelType === "O") {
      return isModerator || false;
    }

    if (channelType === "D" || channelType === "G" || channelType === "P") {
      return isMember;
    }

    return false;
  }, [channelData?.channel?.type, channelData?.canModerate, channelData?.member]);

  const handleDelete = useCallback(
    (post: MattermostPost) => {
      const currentUserId = channelData?.member?.user_id;
      const canDelete = channelData?.canModerate || (currentUserId && post.user_id === currentUserId);
      if (!canDelete) return;
      if (typeof window !== "undefined" && !window.confirm("Delete this message?")) return;

      setModerationError(null);
      setDeletingPostId(post.id);
      deleteMutation.mutate(post.id, {
        onError: (err) => {
          setModerationError((err as Error)?.message || "Unable to delete message");
          setDeletingPostId(null);
        },
        onSuccess: () => {
          setDeletingPostId(null);
        }
      });
    },
    [channelData?.member?.user_id, channelData?.canModerate, deleteMutation]
  );

  const toggleReaction = useCallback(
    (post: MattermostPost, emoji: string, closePicker = false) => {
      const emojiName = toMattermostEmojiName(emoji);

      if (!emojiName || !channelData?.member?.user_id) return;

      const reactions = post.metadata?.reactions ?? [];
      const hasReacted = reactions.some(
        (reaction) =>
          reaction.emoji_name === emojiName && reaction.user_id === channelData.member?.user_id
      );

      reactMutation.mutate({
        postId: post.id,
        emoji: emojiName,
        add: !hasReacted
      });

      if (closePicker) {
        setOpenReactionPostId((current) => (current === post.id ? null : current));
      }
    },
    [channelData?.member?.user_id, reactMutation]
  );

  const handlePinToggle = useCallback((postId: string, isPinned: boolean) => {
    if (!canPin) return;

    if (!isPinned && (pinnedPostsQuery.data?.posts.length ?? 0) >= 5) {
      return "Cannot pin more than 5 messages per channel";
    }

    const mutation = isPinned ? unpinPostMutation : pinPostMutation;
    mutation.mutate(postId, {
      onError: (err) => {
        setModerationError((err as Error)?.message || "Unable to update pin");
      }
    });

    return null;
  }, [canPin, pinnedPostsQuery.data?.posts.length, pinPostMutation, unpinPostMutation]);

  return {
    deletingPostId,
    moderationError,
    setModerationError,
    openReactionPostId,
    setOpenReactionPostId,
    showPinnedModal,
    setShowPinnedModal,
    deleteMutation,
    reactMutation,
    pinnedPostsQuery,
    pinPostMutation,
    unpinPostMutation,
    canPin,
    handleDelete,
    toggleReaction,
    handlePinToggle
  };
}
