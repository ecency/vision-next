"use client";

import { useMutation } from "@tanstack/react-query";
import { Community } from "@/entities";
import {
  useSubscribeCommunityMutation,
  useUnsubscribeCommunityMutation
} from "@/api/sdk-mutations";

/**
 * Combined subscribe/unsubscribe to community mutation hook.
 *
 * This hook wraps the SDK mutations (useSubscribeCommunityMutation and useUnsubscribeCommunityMutation)
 * to provide a single interface that handles both subscribe and unsubscribe actions.
 *
 * @param community - The community to subscribe/unsubscribe to/from
 * @returns Mutation result with combined subscribe/unsubscribe function
 *
 * @deprecated This combined hook is kept for backward compatibility.
 * New code should use useSubscribeCommunityMutation or useUnsubscribeCommunityMutation directly.
 *
 * @example
 * ```typescript
 * const { mutateAsync: subscribe, isPending } = useSubscribeToCommunity(community);
 *
 * // Subscribe
 * await subscribe({ isSubscribe: true });
 *
 * // Unsubscribe
 * await subscribe({ isSubscribe: false });
 * ```
 */
export function useSubscribeToCommunity(community: Community) {
  const subscribeMutation = useSubscribeCommunityMutation();
  const unsubscribeMutation = useUnsubscribeCommunityMutation();

  return useMutation({
    mutationKey: ["subscribeToCommunity", community?.name],
    mutationFn: async ({ isSubscribe }: { isSubscribe: boolean }) => {
      if (isSubscribe) {
        await subscribeMutation.mutateAsync({ community: community.name });
      } else {
        await unsubscribeMutation.mutateAsync({ community: community.name });
      }
    }
  });
}
