/**
 * SDK-based mutation hooks for web app.
 *
 * These hooks wrap SDK mutations with web-specific adapters and logic.
 * Gradually migrating from legacy mutations to SDK mutations.
 */

export { useVoteMutation } from "./use-vote-mutation";
export { useReblogMutation } from "./use-reblog-mutation";
export { useCommentMutation } from "./use-comment-mutation";
export { useFollowMutation } from "./use-follow-mutation";
export { useUnfollowMutation } from "./use-unfollow-mutation";
export { useDeleteCommentMutation } from "./use-delete-comment-mutation";
export { useMutePostMutation } from "./use-mute-post-mutation";
export { useSubscribeCommunityMutation } from "./use-subscribe-community-mutation";
export { useUnsubscribeCommunityMutation } from "./use-unsubscribe-community-mutation";
export { useUpdateProfileMutation } from "./use-update-profile-mutation";
