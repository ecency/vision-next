"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Entry } from "@/entities";
import { error } from "@/features/shared";
import i18next from "i18next";
import { useUpdateProfile } from "@/api/mutations/update-profile";
import { QueryKeys } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function usePinToBlog(entry: Entry, onSuccess: () => void) {
  const { activeUser, account } = useActiveAccount();
  const qc = useQueryClient();

  const { mutateAsync: updateProfile } = useUpdateProfile(account ?? null);

  return useMutation({
    mutationKey: ["pinToBlog"],
    mutationFn: async ({ pin }: { pin: boolean }) => {
      if (!account) {
        throw new Error("Account not loaded");
      }

      const ownEntry = activeUser && activeUser.username === entry.author;
      const { name } = account;

      if (ownEntry && activeUser) {
        // Send ONLY the field we are changing. The SDK reads the current
        // on-chain profile and deep-merges, so re-sending other fields here
        // (especially with `|| ""` fallbacks built from a possibly stale or
        // unloaded snapshot) would risk overwriting them with empty values.
        await updateProfile({
          nextProfile: { pinned: pin ? entry.permlink : "" }
        });

        // Invalidate account query to refresh profile data
        qc.invalidateQueries({
          queryKey: QueryKeys.accounts.full(name)
        });
      }
    },
    onSuccess,
    onError: () => error(i18next.t("g.server-error"))
  });
}
