import { useMutation } from "@tanstack/react-query";
import { PrivateKey } from "@hiveio/dhive";
import { useGlobalStore } from "@/core/global-store";
import { client as hiveClient } from "@/api/hive";
import { formatError } from "@/api/operations";
import { error } from "@/features/shared";
import { useTransferGetOperation } from "@/app/(dynamicPages)/profile/[username]/engine/_mutations/transfer-get-operation";

export function useTransferEngineByKey(onSuccess: () => void) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const updateActiveUser = useGlobalStore((s) => s.updateActiveUser);

  const getOperation = useTransferGetOperation();

  return useMutation({
    mutationKey: ["transfer-engine", "key"],
    mutationFn: async ({
      key,
      ...payload
    }: {
      amount: string;
      mode: string;
      key: PrivateKey;
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

      return hiveClient.broadcast.json(op, key);
    },
    onSuccess: () => {
      onSuccess();
      updateActiveUser();
    },
    onError: (e) => error(...formatError(e))
  });
}
