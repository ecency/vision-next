import { useMutation } from "@tanstack/react-query";
import { formatError } from "@/api/operations";
import { PrivateKey } from "@hiveio/dhive";
import { error } from "@/features/shared";
import { useDelegateVestingSharesMutation } from "@/api/sdk-mutations";

/**
 * Legacy hook for delegating vesting shares with private key.
 * Now delegates to SDK mutation for unified auth handling.
 *
 * @deprecated Use useDelegateVestingSharesMutation() instead
 */
export function useDelegateVestingSharesByKey(username?: string) {
  const { mutateAsync: delegate } = useDelegateVestingSharesMutation();

  return useMutation({
    mutationKey: ["delegateVestingSharesByKey", username],
    mutationFn: ({
      key,
      value = "0.000000 VESTS",
      delegatee = username
    }: {
      key: PrivateKey;
      value: string;
      delegatee?: string;
    }) => {
      // SDK mutation handles auth internally via adapter
      return delegate({
        delegatee: delegatee ?? username ?? "",
        vestingShares: value
      });
    },
    onError: (err) => error(...formatError(err))
  });
}

/**
 * Legacy hook for delegating vesting shares with Keychain.
 * Now delegates to SDK mutation for unified auth handling.
 *
 * @deprecated Use useDelegateVestingSharesMutation() instead
 */
export function useDelegateVestingSharesByKeychain(username?: string) {
  const { mutateAsync: delegate } = useDelegateVestingSharesMutation();

  return useMutation({
    mutationKey: ["delegateVestingSharesByKC", username],
    mutationFn: ({
      value = "0.000000 VESTS",
      delegatee = username
    }: {
      value: string;
      delegatee?: string;
    }) => {
      // SDK mutation handles auth internally via adapter
      return delegate({
        delegatee: delegatee ?? username ?? "",
        vestingShares: value
      });
    },
    onError: (err) => error(...formatError(err))
  });
}
