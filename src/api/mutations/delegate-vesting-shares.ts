import { useMutation } from "@tanstack/react-query";
import { formatError } from "@/api/operations";
import { Operation, PrivateKey } from "@hiveio/dhive";
import { client as hiveClient } from "@/api/hive";
import { useGlobalStore } from "@/core/global-store";
import { error } from "@/features/shared";
import * as keychain from "@/utils/keychain";

export function useDelegateVestingSharesByKey(username?: string) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  return useMutation({
    mutationKey: ["delegateVestingSharesByKey", activeUser?.username, username],
    mutationFn: ({
      key,
      value = "0.000000 VESTS",
      delegatee = username
    }: {
      key: PrivateKey;
      value: string;
      delegatee?: string;
    }) => {
      const op: Operation = [
        "delegate_vesting_shares",
        {
          delegator: activeUser?.username,
          delegatee,
          vesting_shares: value
        }
      ];

      return hiveClient.broadcast.sendOperations([op], key);
    },
    onError: (err) => error(...formatError(err))
  });
}

export function useDelegateVestingSharesByKeychain(username?: string) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  return useMutation({
    mutationKey: ["delegateVestingSharesByKC", activeUser?.username, username],
    mutationFn: ({
      value = "0.000000 VESTS",
      delegatee = username
    }: {
      value: string;
      delegatee?: string;
    }) => {
      const op: Operation = [
        "delegate_vesting_shares",
        {
          delegator: activeUser?.username,
          delegatee,
          vesting_shares: value
        }
      ];

      return keychain.broadcast(activeUser!.username, [op], "Active");
    },
    onError: (err) => error(...formatError(err))
  });
}
