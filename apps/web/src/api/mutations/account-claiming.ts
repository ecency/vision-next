import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PrivateKey } from "@hiveio/dhive";
import { FullAccount } from "@/entities";
import { QueryIdentifiers } from "@/core/react-query";
import { useClaimAccountMutation } from "@/api/sdk-mutations";

/**
 * Legacy hook for claiming account tokens.
 * Now delegates to SDK mutation for unified auth handling.
 *
 * @deprecated Use useClaimAccountMutation() from sdk-mutations instead
 */
export function useAccountClaiming(account: FullAccount) {
  const queryClient = useQueryClient();
  const { mutateAsync: claimAccount } = useClaimAccountMutation();

  return useMutation({
    mutationKey: ["account-claiming", account.name],
    mutationFn: async ({ isKeychain, key }: { key?: PrivateKey; isKeychain?: boolean }) => {
      try {
        return await claimAccount({
          creator: account.name,
          fee: "0.000 HIVE"
        });
      } catch (error) {
        throw new Error("Failed RC claiming. Please, try again or contact with support.");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData<FullAccount>(
        [QueryIdentifiers.GET_ACCOUNT_FULL, account.name],
        (data) => {
          if (!data) {
            return data;
          }

          data.pending_claimed_accounts = 0;
          return data;
        }
      );
    }
  });
}
