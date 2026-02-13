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
export { useSetCommunityRoleMutation } from "./use-set-community-role-mutation";
export { useUpdateCommunityMutation } from "./use-update-community-mutation";
export { useCrossPostMutation } from "./use-cross-post-mutation";
export { useUpdateReplyMutation } from "./use-update-reply-mutation";
export { useDelegateVestingSharesMutation } from "./use-delegate-vesting-shares-mutation";
export { useSetWithdrawVestingRouteMutation } from "./use-set-withdraw-vesting-route-mutation";
export { useWitnessVoteMutation } from "./use-witness-vote-mutation";
export { useProposalVoteMutation } from "./use-proposal-vote-mutation";
export { usePromoteMutation } from "./use-promote-mutation";
export { useCommunityRewardsRegisterMutation } from "./use-community-rewards-register-mutation";
export { useClaimAccountMutation } from "./use-claim-account-mutation";
export { useAddDraftMutation } from "./use-add-draft-mutation";
export { useDeleteDraftMutation } from "./use-delete-draft-mutation";
export { useDeleteScheduleMutation } from "./use-delete-schedule-mutation";
export { useMoveScheduleMutation } from "./use-move-schedule-mutation";
export { useDeleteImageMutation } from "./use-delete-image-mutation";
export { useUploadImageMutation } from "./use-upload-image-mutation";
