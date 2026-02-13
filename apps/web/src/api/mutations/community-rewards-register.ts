import { useMutation } from "@tanstack/react-query";
import { formatError } from "@/api/operations";
import { error } from "@/features/shared";
import { Community } from "@/entities";
import { PrivateKey } from "@hiveio/dhive";
import { useCommunityRewardsRegisterMutation } from "@/api/sdk-mutations";

/**
 * Legacy hook for registering community rewards via Keychain.
 * Now delegates to SDK mutation for unified auth handling.
 *
 * @deprecated Use useCommunityRewardsRegisterMutation() from sdk-mutations instead
 */
export function useCommunityRewardsRegisterKc(community: Community, onSuccess: () => void) {
  const { mutateAsync: register } = useCommunityRewardsRegisterMutation();

  return useMutation({
    mutationKey: ["communityRewardsRegisterKc"],
    mutationFn: () => register({ name: community.name }),
    onError: (err) => error(...formatError(err)),
    onSuccess
  });
}

/**
 * Legacy hook for registering community rewards via API/private key.
 * Now delegates to SDK mutation for unified auth handling.
 *
 * @deprecated Use useCommunityRewardsRegisterMutation() from sdk-mutations instead
 */
export function useCommunityRewardsRegister(community: Community, onSuccess: () => void) {
  const { mutateAsync: register } = useCommunityRewardsRegisterMutation();

  return useMutation({
    mutationKey: ["communityRewardsRegister"],
    mutationFn: ({ key }: { key: PrivateKey }) => register({ name: community.name }),
    onError: (err) => error(...formatError(err)),
    onSuccess
  });
}
