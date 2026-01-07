"use client";

import { useMutation } from "@tanstack/react-query";
import { Operation, PrivateKey } from "@hiveio/dhive";
import { CONFIG } from "@ecency/sdk";
import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import * as keychain from "@/utils/keychain";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useWithDrawRouteByKey(account: string, percent: number, auto: string) {
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["withDrawRoute", account],
    mutationFn: ({ key }: { key: PrivateKey }) => {
      const op: Operation = [
        "set_withdraw_vesting_route",
        {
          from_account: activeUser!.username,
          to_account: account,
          percent: percent*100,
          auto_vest: auto === "yes"
        }
      ];

      return CONFIG.hiveClient.broadcast.sendOperations([op], key);
    },
    onError: (err) => error(...formatError(err))
  });
}

export function useWithDrawRouteByKeychain(account: string, percent: number, auto: string) {
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["withDrawRoute", account],
    mutationFn: () => {
      const op: Operation = [
        "set_withdraw_vesting_route",
        {
          from_account: activeUser!.username,
          to_account: account,
          percent: percent*100,
          auto_vest: auto === "yes"
        }
      ];

      return keychain.broadcast(activeUser!.username, [op], "Active");
    },
    onError: (err) => error(...formatError(err))
  });
}
