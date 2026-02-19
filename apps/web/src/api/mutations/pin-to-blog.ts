"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Entry, FullAccount } from "@/entities";
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
      const { profile, name } = account;

      if (ownEntry && pin && profile && activeUser) {
        await updateProfile({
          nextProfile: {
            name: profile?.name || "",
            about: profile?.about || "",
            cover_image: profile?.cover_image || "",
            profile_image: profile?.profile_image || "",
            website: profile?.website || "",
            location: profile?.location || "",
            pinned: entry.permlink
          }
        });

        // Invalidate account query to refresh profile data
        qc.invalidateQueries({
          queryKey: QueryKeys.accounts.full(name)
        });
      } else if (ownEntry && !pin && profile && activeUser) {
        await updateProfile({
          nextProfile: {
            name: profile?.name || "",
            about: profile?.about || "",
            cover_image: profile?.cover_image || "",
            profile_image: profile?.profile_image || "",
            website: profile?.website || "",
            location: profile?.location || "",
            pinned: ""
          }
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
