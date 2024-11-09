import { useMutation } from "@tanstack/react-query";
import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import { useGlobalStore } from "@/core/global-store";
import { useTransferGetOperation } from "@/app/(dynamicPages)/profile/[username]/engine/_mutations/transfer-get-operation";
import * as keychain from "@/utils/keychain";

export function useTransferEngineByKeychain(onSuccess: () => void) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const updateActiveUser = useGlobalStore((s) => s.updateActiveUser);

  const getOperation = useTransferGetOperation();

  return useMutation({
    mutationKey: ["transfer-engine", "keychain"],
    mutationFn: async (payload: {
      amount: string;
      mode: string;
      to: string;
      memo: string;
      asset: string;
    }) => {
      if (!activeUser) {
        throw new Error("[HiveEngine][Transfer][Key] No active user");
      }

      const op = getOperation({
        from: activeUser.username,
        ...payload
      });

      if (!op) {
        throw new Error("[HiveEngine][Transfer][Key] No operation details");
      }

      return keychain.customJson(
        activeUser.username,
        "ssc-mainnet-hive",
        "Active",
        op.json,
        "Transfer"
      );
    },
    onSuccess: () => {
      onSuccess();
      updateActiveUser();
    },
    onError: (e) => error(...formatError(e))
  });
}
