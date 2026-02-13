"use client";

import { useMutation } from "@tanstack/react-query";
import { PrivateKey } from "@hiveio/dhive";
import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import { useSetWithdrawVestingRouteMutation } from "@/api/sdk-mutations";

/**
 * Legacy hook for setting withdraw vesting route with private key.
 * Now delegates to SDK mutation for unified auth handling.
 *
 * @deprecated Use useSetWithdrawVestingRouteMutation() instead
 */
export function useWithDrawRouteByKey(account: string, percent: number, auto: string) {
  const { mutateAsync: setRoute } = useSetWithdrawVestingRouteMutation();

  return useMutation({
    mutationKey: ["withDrawRoute", account],
    mutationFn: ({ key }: { key: PrivateKey }) => {
      // SDK mutation handles auth internally via adapter
      return setRoute({
        toAccount: account,
        percent: percent * 100, // SDK expects 0-10000
        autoVest: auto === "yes"
      });
    },
    onError: (err) => error(...formatError(err))
  });
}

/**
 * Legacy hook for setting withdraw vesting route with Keychain.
 * Now delegates to SDK mutation for unified auth handling.
 *
 * @deprecated Use useSetWithdrawVestingRouteMutation() instead
 */
export function useWithDrawRouteByKeychain(account: string, percent: number, auto: string) {
  const { mutateAsync: setRoute } = useSetWithdrawVestingRouteMutation();

  return useMutation({
    mutationKey: ["withDrawRoute", account],
    mutationFn: () => {
      // SDK mutation handles auth internally via adapter
      return setRoute({
        toAccount: account,
        percent: percent * 100, // SDK expects 0-10000
        autoVest: auto === "yes"
      });
    },
    onError: (err) => error(...formatError(err))
  });
}
