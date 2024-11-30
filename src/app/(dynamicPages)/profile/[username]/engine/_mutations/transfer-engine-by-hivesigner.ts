import { useCallback } from "react";
import { hotSign } from "@/utils";
import { useGlobalStore } from "@/core/global-store";
import { useTransferGetOperation } from "@/app/(dynamicPages)/profile/[username]/engine/_mutations/transfer-get-operation";

export function useTransferEngineByHivesigner(afterSign: () => void) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const getOperation = useTransferGetOperation();

  return useCallback(
    (payload: { amount: string; mode: string; to: string; memo: string; asset: string }) => {
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

      hotSign("custom-json", op, `@${activeUser.username}/engine`);
      afterSign();
    },
    [activeUser, afterSign, getOperation]
  );
}
